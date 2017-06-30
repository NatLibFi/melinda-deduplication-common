# Convert MARC records between different formats [![Build Status](https://travis-ci.org/NatLibFi/marc-record-converters.svg)](https://travis-ci.org/NatLibFi/marc-record-converters) [![Test Coverage](https://codeclimate.com/github/NatLibFi/marc-record-converters/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/marc-record-converters/coverage)

Convert MARC records between different formats. The following converters are available:

- **marc21slim-xml**: [Library of Congress's](https://www.loc.gov) XML representation of MARC21. XML documents must validate against the [schema](https://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd)
- **iso2709**: MARC21 instance of [ISO 2709 exhange format](http://www.iso.org/iso/iso_catalogue/catalogue_tc/catalogue_detail.htm?csnumber=41319)
- **aleph-sequential**: Internal MARC21 format of [Ex Libris's Aleph ILS](http://www.exlibrisgroup.com/category/Aleph)

## Usage

### AMD
```js
define(['marc-record-converters'], function(marc_record_converters) {

 ...
 var record = marc_record_converters.marc21slimXML.from(marcxml_str);
 console.log(marc_record_converters.marc21slimXML.to(record));
 ...

});
```

### Node.js
```js
...
var marc_record_converters = require('marc-record-converters'),
    record = marc_record_converters.marc21slimXML.from(marcxml_str);

console.log(marc_record_converters.marc21slimXML.to(record));
...
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

This project is based on [marc-record-serializers](https://github.com/petuomin/marc-record-serializers). Both the original and the modified work are licensed under the terms of **ISC License**.

**Modified work**: Copyright (c) 2015, 2017 University Of Helsinki (The National Library Of Finland)  
**Original work**: Copyright (c) 2015 Pasi Tuominen
