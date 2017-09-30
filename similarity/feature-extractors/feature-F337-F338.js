const _ = require('lodash');
const { Labels } = require('./constants');
const { SURE, SURELY_NOT, ABSOLUTELY_NOT_DOUBLE } = Labels;


const isDefined = (...args) => args.every(arg => arg !== undefined && arg !== null);

const {
  fromXMLjsFormat,
  selectValues,
  normalizeWith,
  normalizeText,
  isIdentical
} = require('./utils');

function F337_F338(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  

  const getFieldValue = (field, code) => field && _.get(field, 'subfields', []).filter(s => s.code === code).map(s => s.value).join(' ');

  const getF337a = (record) => getFieldValue(record.fields.find(f => f.tag === '337'), 'a');
  const select338a = _.flow(selectValues('338', 'a'), normalizeWith(arr => arr.map(normalizeText)));
  
  const record1F337a = getF337a(record1);
  const record2F337a = getF337a(record2);

  function check() {

    const norm = (str) => str && str.replace(/\W/g, '').toUpperCase().trim();
    const isEqual = (val1, val2) => norm(val1) === norm(val2);
    const toLabel = (t,f) => val => val === null ? null : val ? t : f;
  
    const f337result = isDefined(record1F337a, record2F337a) ? isEqual(record1F337a, record2F337a) : null;

    const set1OK = select338a(record1).length > 0;
    const set2OK = select338a(record2).length > 0;
    
    const f338result = set1OK && set2OK ? isIdentical(select338a(record1), select338a(record2)) : null;
    
    const f337Label = toLabel(SURE, SURELY_NOT)(f337result);
    const f338Label = toLabel(SURE, ABSOLUTELY_NOT_DOUBLE)(f338result);

    return [f337Label, f338Label];

  }

  return {
    check: check,
    names: ['F337', 'F338']
  };

}

module.exports = F337_F338;