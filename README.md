[![Build Status](https://travis-ci.org/csgis/json-module-args-loader.svg?branch=master)](https://travis-ci.org/csgis/json-module-args-loader) [![codecov](https://codecov.io/gh/csgis/json-module-args-loader/branch/master/graph/badge.svg)](https://codecov.io/gh/csgis/json-module-args-loader) [![npm](https://img.shields.io/npm/v/@csgis/json-module-args-loader.svg)](https://www.npmjs.com/package/@csgis/json-module-args-loader) [![downloads](https://img.shields.io/npm/dt/@csgis/json-module-args-loader.svg)](https://www.npmjs.com/package/@csgis/json-module-args-loader)

# JSON Module Arguments Loader

A Webpack loader that loads a JSON object and fills a property with a map of argument names for each module in a specific property.

It is possible to configure the name of the function and the number of arguments to skip.

If the JSON object already contains a property with argument names it merges them, preserving the ones in the JSON file.

## Install

With npm:

```
npm install --save-dev @csgis/json-module-args-loader
```

With yarn:

```
yarn add -D @csgis/json-module-args-loader
```

## Usage

**webpack.config.js**

```js
{
   test: /app\.json$/,
   use: [{
     loader: 'json-module-args-loader',
     options: {
       'function': 'f',
       'skip': 1
     }
   }]
}
```

**app.json**
```json
{
  "modules": {
    "x": "./file.js"
  }
}
```

**file.js**
```js
export function f(opts, dependency) {}
```

**main.js**
```js
import app from './app.json';
console.log(`${app.deps.x} must be ['dependency']`);
```

## Options

| Name     | Type          | Default   | Description |
|----------|---------------|-----------|-------------|
| modules  | `{ String }`  | `modules` | Name of the property JSON property with module paths. |
| args     | `{ String }`  | `args`    | Name of the property JSON property to put argument names. |
| function | `{ String }`  | `bricjs`  | Name of the function to parse. |
| skip     | `{ Integer }` | `0`       | Number of function arguments to skip. |
