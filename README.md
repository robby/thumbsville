# Thumbsville — Organize your Hapi app with route packs that allow you to separate sections of the app.

[![NPM](https://nodei.co/npm/thumbsville.png)](https://nodei.co/npm/thumbsville/)

## Easy setup

Add Thumbsville to your Hapi project as a dependency in your package.json

```
npm install thumbsville --save
```

## Configuration

Route packs are located automatically just by giving the root folder. In this example all subfolders under ./hoods will be searched for route packs. 

```javascript
var Thumbsville = require('thumbsville');

Thumbsville.viewOptions = function(plugin){ 
	return { 
		engines: {
			html: {
				module: require('handlebars').create()
			}
		}, 
		path: './views', 
		layoutPath: './layouts', 
		layout: 'master',
		helpersPath: './helpers'
	};
};

Thumbsville.findRoutePacks(server /* Hapi server */, './hoods');
```
