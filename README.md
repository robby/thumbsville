# Thumbsville
Organize your Hapi app with route packs that allow you to separate sections of the app called ```hoods```.

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


## Shared paths

Shared paths allow you to have local content for each hood but still keep shared views, layouts, helpers and partials in one place.

```javascript
Thumbsville.sharedPaths = __dirname + '/common';
```

Add this before calling ```Thumbsville.findRoutePacks``` to use shared and local paths for all view related content. In this example, the ```path``` property of ```viewOptions``` would have ```/common/views``` appended to the view search list for all views in that hood.
