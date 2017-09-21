const { Labels } = require('./constants');

const {
  fromXMLjsFormat,
  extractFormat
} = require('./utils');


function format(record1, record2) {
  
  const formatA = extractFormat(fromXMLjsFormat(record1));
  const formatB = extractFormat(fromXMLjsFormat(record2));
  
  const formatNames = ['BK', 'CR', 'MP', 'MU', 'CF', 'MX', 'VM'];  

  function check() {

    console.log(formatA, formatB);

    if (formatA === undefined || formatB === undefined) {
      return formatNames.map(() => null);
    }

    if (formatA !== formatB) {
      return formatNames.map(() => Labels.ABSOLUTELY_NOT_DOUBLE);
    }

    return formatNames.map(format => {
      return format === formatA ? Labels.SURE : Labels.SURELY_NOT;
    });
    
  }

  return {
    check: check,
    names: formatNames.map(name => `format-${name}`)
  };
}

module.exports = format;