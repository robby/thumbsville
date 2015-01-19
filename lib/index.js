// Load modules

var Fs = require('fs');
var Path = require('path');

var internals = {};

exports.enableLogging = false;
exports.viewOptions = null;
exports.fileOptions = { directoryName: 'static', routePath: '/static', listing: false };

exports.findRoutePacks = function (server, folder, callback) {

	// Start in provided directory or default to 'hoods'

	folder = Path.resolve(Path.dirname(module.parent.filename), folder || './hoods');

	internals.pending = 0;

	Fs.readdir(folder, function(err, files) {
		if (err) {
			return exports.enableLogging && server.log('error', 'Error finding route packs in folder: ' + folder);
		}

		exports.enableLogging && server.log('info', 'Found ' + files.length + ' director' + (files.length == 1 ? 'y' : 'ies'));

		files.forEach(function(filename) {
			
			internals.pending++;

			Fs.stat(Path.resolve(folder, filename), function(err, stat) {
				if (stat && stat.isDirectory()) {
					var routePacks = Path.resolve(folder, filename, 'routes');
					var staticPath = Path.resolve(folder, filename, exports.fileOptions.directoryName);

					// Search folder 'routes' for route packs

					Fs.stat(routePacks, function(err, stat) {
						if(stat && stat.isDirectory()) {
							Fs.readdir(routePacks, function(err, files) {
								internals.pending += files.length;

								files.forEach(function(filename) {
									internals.pending--;
									internals.registerPack(server, routePacks, filename);

									if(files.indexOf(filename) == files.length - 1) {
										internals.pending--;
									}

									if(!internals.pending) {
										callback();
									}
								});
							});
						}
					});

					// Wire up static path for assets

					Fs.stat(staticPath, function(err, stat) {
						if(stat && stat.isDirectory()) {
							server.route({ method: 'GET', path: Path.join(exports.fileOptions.routePath, filename, '{files*}'), handler: { directory: { path: staticPath, listing: exports.fileOptions.listing }}});
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

internals.registerPack = function (server, routePacks, filename) {
	var routePackPath = Path.resolve(routePacks, filename);
	var routePackPlugin = require(routePackPath);

	exports.enableLogging && server.log('info', 'Found route pack in ' + filename);

	var routePackRegister = function(server, options, next) {
		if (exports.viewOptions) {
			server.path(Path.resolve(routePacks + '/..'));

			server.ext('onPostHandler', function(request, reply){
				if(request.response.variety !== 'view') return reply.continue();

				var context = request.response.source.context = request.response.source.context || {};

				context.scripts = [];
				context.styles = [];

				context.scriptLiterals = [];
				context.styleLiterals = [];

				reply.continue();
			});

			var viewOptions = exports.viewOptions(server);

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
			exports.enableLogging && server.log('error', 'Error loading pack ' + routePackPath);
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