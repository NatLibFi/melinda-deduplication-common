# W3C XML DOM that works in browsers and Node.js [![Build Status](https://travis-ci.org/NatLibFi/xmldom-xplat.svg)](https://travis-ci.org/NatLibFi/xmldom-xplat) [![Test Coverage](https://codeclimate.com/github/NatLibFi/xmldom-xplat/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/xmldom-xplat/coverage)

W3C XML DOM that works in browsers and Node.js. This project provides modules for AMD and CommonJS module loaders. Native implementations are used in browser and [xmldom](https://www.npmjs.com/package/xmldom) on Node.js.

## Usage

### AMD
```js
define(['xmldom-xplat/lib/browser'], function(xmldom) {
  var doc = new xmldom.DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', undefined);
});
```

### Node.js
```js
var xmldom = require('xmldom-xplat/lib/nodejs'),
    doc = new xmldom.DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', undefined);
```

## Development 

Clone the sources and install the package using `npm`:

```sh
npm install
```

Run the following NPM script to lint, test and check coverage of the code:

```javascript

npm run check

```

## License and copyright

Copyright (c) 2017 **University Of Helsinki (The National Library Of Finland)**

This project's source code is dual-licensed either under the terms of **MIT License** or **Lesser GNU General Public License version 3.0 or any later version**.
