// Load modules

var Discover = require('./discover');
var Hoek = require('hoek');

// Declare internals

var internals = {
    defaults: {
        enableLogging: false,
        fileOptions: { directoryName: 'static', routePath: '/static', listing: false, config: { auth: false } },
        hoods: './hoods',
        viewOptions: function(plugin){
            return {
                engines: { handlebars: { module: require('handlebars').create() } },
                path: './views',
                layoutPath: './layouts',
                layout: 'main',
                helpersPath:'./helpers',
                partialsPath: './partials',
                isCached: process.env.NODE_ENV === 'production'
            };
        }
    }
};

exports.register = function (server, options, next) {
    var settings = Hoek.applyToDefaults(internals.defaults, options);

    Discover.findRoutePacks(server, settings, next);
};

exports.register.attributes = {
    pkg: require('../package.json'),
    connections: true,
    once: true
};
