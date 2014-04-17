var Hapi = require('hapi'), fs = require('fs'), Path = require('path');

module.exports = { 
	search: function(server, folder) {
		var searchPath = Path.resolve(Path.dirname(module.parent.filename), folder);
		findRoutePacks(server, searchPath);
	}
};

function findRoutePacks(server, folder) {
	fs.readdir(folder, function(err, files) {
		if (err) {
			console.error('error loading route packs');
		}

		console.log('found ' + files.length + ' director' + (files.length == 1 ? 'y' : 'ies'));

		files.forEach(function(filename) {
			fs.stat(Path.resolve(folder, filename), function(err, stat) {
				if (stat && stat.isDirectory()) {
					// expected folder structure: routes, public, views
					var routePacks = Path.resolve(folder, filename, 'routes');
					
					fs.stat(routePacks, function(err, stat) {
						if(stat && stat.isDirectory()) {
							fs.readdir(routePacks, function(err, files) {
								files.forEach(function(filename) {
									var routePackPath = Path.resolve(routePacks, filename);
									var plugin = require(routePackPath);

									console.log('found routes in ' + filename);
																		
									plugin.name = plugin.name || filename;
									plugin.version = plugin.version || '1.0.0';

									server.pack.register(plugin, function(err) {
										if(err) {
											console.log('error loading pack ' + routePackPath);
										}
									});
								});
							});
						}
					});
				}
			});
		});
	});
}
