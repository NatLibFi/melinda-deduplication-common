const _ = require('lodash');
const { Labels } = require('./constants');

const isDefined = (...args) => args.every(arg => arg !== undefined && arg !== null);

const {
  fromXMLjsFormat
} = require('./utils');

function F337_F338(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  

  const getFieldValue = (field, code) => field && _.get(field, 'subfields', []).filter(s => s.code === code).map(s => s.value).join(' ');

  const getF337a = (record) => getFieldValue(record.fields.find(f => f.tag === '337'), 'a');
  const getF338a = (record) => getFieldValue(record.fields.find(f => f.tag === '338'), 'a');

  const record1F337a = getF337a(record1);
  const record2F337a = getF337a(record2);

  const record1F338a = getF338a(record1);
  const record2F338a = getF338a(record2);
  
  function check() {

    const norm = (str) => str && str.replace(/\W/g, '').toUpperCase().trim();
    const isEqual = (val1, val2) => norm(val1) === norm(val2);
    const toLabel = val => val ? Labels.SURE : Labels.SURELY_NOT;

    const f337result = isDefined(record1F337a, record2F337a) ? toLabel(isEqual(record1F337a, record2F337a)) : null;
    const f338result = isDefined(record1F338a, record2F338a) ? toLabel(isEqual(record1F338a, record2F338a)) : null;
    
    return [f337result, f338result];

  }

  return {
    check: check,
    names: ['F337', 'F338']
  };

}

module.exports = F337_F338;