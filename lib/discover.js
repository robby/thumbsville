// Load modules

var Fs = require('fs');
var Path = require('path');

var internals = {};

exports.findRoutePacks = function (server, settings, callback) {

	// Start in provided directory or default to 'hoods'

	var path = Path.resolve(Path.dirname(module.parent.parent.filename), settings.hoods || './hoods');

	internals.pending = 0;

	Fs.readdir(path, function(err, files) {
		if (err) {
			return settings.enableLogging && server.log('error', 'Error finding route packs in path: ' + path);
		}

		settings.enableLogging && server.log('info', 'Found ' + files.length + ' director' + (files.length == 1 ? 'y' : 'ies'));

		files.forEach(function(filename) {

			internals.pending++;

			Fs.stat(Path.resolve(path, filename), function(err, stat) {
				if (stat && stat.isDirectory()) {
					var routePacks = Path.resolve(path, filename, 'routes');
					var staticPath = Path.resolve(path, filename, settings.fileOptions.directoryName);

					// Search path 'routes' for route packs

					Fs.stat(routePacks, function(err, stat) {
						if(stat && stat.isDirectory()) {
							Fs.readdir(routePacks, function(err, files) {
								internals.pending += files.length;

								files.forEach(function(filename) {
									internals.pending--;
									internals.registerPack(server, settings, routePacks, filename);

									if(files.indexOf(filename) == files.length - 1) {
										internals.pending--;
									}

									if(!internals.pending) {
										callback();
									}
								});
							});
						}
						else {
							internals.pending--;
						}
					});

					// Wire up static path for assets

					Fs.stat(staticPath, function(err, stat) {
						if(stat && stat.isDirectory()) {
							server.route({ method: 'GET', path: [settings.fileOptions.routePath, filename, '{files*}'].join('/'), handler: { directory: { path: staticPath, listing: settings.fileOptions.listing }}, config: settings.fileOptions.config });
						}
					});
				}
				else {
					internals.pending--;
				}
			});
		});
	});
};

internals.registerPack = function (server, settings, routePacks, filename) {

	var routePackPath = Path.resolve(routePacks, filename);
	var routePackPlugin = require(routePackPath);

	settings.enableLogging && server.log('info', 'Found route pack in ' + filename);

	if (!routePackPlugin.register) return server.error('Empty route pack', filename);

	var routePackRegister = function(server, options, next) {

		if (settings.viewOptions && Fs.existsSync(routePacks + '/../views')) {
			var hoodPath = Path.resolve(routePacks + '/..');

			server.path(hoodPath);

			server.ext('onPostHandler', function(request, reply){
				if(request.response.variety !== 'view') return reply.continue();

				var context = request.response.source.context = request.response.source.context || {};

				context.scripts = [];
				context.styles = [];

				context.scriptLiterals = [];
				context.styleLiterals = [];

				reply.continue();
			});

			var viewOptions = settings.viewOptions(server);

			if (settings.sharedPaths) {

				// Combine local and shared path for each pathType only if local path exists or default to shared path.

				['path', 'layoutPath', 'partialsPath', 'helpersPath'].forEach(function(pathType) {

					var paths = [];
					var localPath = viewOptions[pathType];

					var resolvedLocalPath = Path.resolve(hoodPath, localPath);
					var localPathStats = Fs.existsSync(resolvedLocalPath) && Fs.statSync(resolvedLocalPath);

					if (localPathStats && localPathStats.isDirectory()) {
						paths.push(localPath);
					}

					paths.push(Path.resolve(settings.sharedPaths, localPath));

					viewOptions[pathType] = paths;
				});
			}

			Object.keys(viewOptions.engines).forEach(function(engineName) {
				viewOptions.engines[engineName].module = internals.wrapHelpers(viewOptions.engines[engineName].module);
			});

			server.views(viewOptions);
		}

		routePackPlugin.register(server, options, next);
	};

	routePackRegister.attributes = { name: routePackPlugin.name || filename, version: routePackPlugin.version || '1.0.0' };

	server.register(routePackRegister, function(err) {

		if(err) {
			settings.enableLogging && server.log('error', 'Error loading pack ' + routePackPath);
		}
	});
};

internals.wrapHelpers = function (viewEngine) {
	viewEngine.helpers.script = function(context) {
		context && context.fn && this.scriptLiterals.push('(function() {\n' + context.fn() + '\n})();');
		context && !context.fn && this.scripts.push({ filename: context });

		return '';
	};

	viewEngine.helpers.style = function(context) {
		context && context.fn && this.styleLiterals.push(context.fn());
		context && !context.fn && this.styles.push({ filename: context });

		return '';
	};

	return viewEngine;
};