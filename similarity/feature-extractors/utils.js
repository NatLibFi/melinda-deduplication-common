const _ = require('lodash');
const normalizeFuncs = require('./core.normalize');
const compareFuncs = require('./core.compare');
const filterFuncs = require('./core.filter');

function normalize(param, normalizerArray, options) {
  options = options || {};
  return _.reduce(normalizerArray, singleNormalize(options), param);
}

function singleNormalize(options) {
  return function (param, normalizer) {
    if (_.isFunction(normalizer)) {
      return normalizer.call(this, param, options);
    }
    if (_.isString(normalizer)) {
      
      var func = eval(`normalizeFuncs.${normalizer}`);
      return func.call(this, param, options);
    }
  };
}

function compare(comparator, param1, param2) {
  if (_.isFunction(comparator)) {
    return comparator.call(this, param1, param2);
  }
  if (_.isString(comparator)) {
    return compareFuncs[comparator].call(this, param1, param2);
  }
}

function select(selectors, record) {
  var selections = _.flattenDeep( _.map(selectors, filter(record)) );
  
  return selections;
}

function filter(record) {
  return function(selector) {
    
    if (_.isFunction(selector)) {
      return selector.call(this, record);
    }
    
    if (_.isString(selector)) {
      
      try {
        var func = eval(selector);
        
        return func.call(null, selector, record);
      } catch(e) {
        
        return filterFuncs.stringSelector(selector, record);
      }
      
    }
  };
}

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}

function hasSubfield(set, codes) {
  var codeList = codes.split('');

  var has = false;
  set.forEach(function(field) {
    field.subfield.forEach(function (sub) {
      if (codeList.indexOf(sub.$.code) !== -1) {
        has = true;
      }
    });
  });
  return has;
}

function getSubfield(field, code) {
  var subfields = getSubfields(field,code);
  if (subfields.length > 1) throw new Error('Record has multiple subfields of code: ' + code);
  return subfields[0];
}

function getSubfields(field, code) {
  var subfields = field.subfield.filter(function(subfield) { return subfield.$.code == code; });
  return _.map(subfields,'_');
}


function fieldToString(field) {
  if (field && field.subfields) {
    const ind1 = field.ind1 || ' ';
    const ind2 = field.ind2 || ' ';
    const subfields = field.subfields.map(subfield => `‡${subfield.code}${subfield.value}`).join('');
    return `${field.tag} ${ind1}${ind2} ${subfields}`;
  } else {
    return `${field.tag}    ${field.value}`;
  }
}

function stringToField(fieldStr) {
  const tag = fieldStr.substr(0,3);
  if (parseInt(tag) < 10) {
    const value = fieldStr.substr(7);
    return { tag, value };
  }
  const ind1 = fieldStr.substr(4,1);
  const ind2 = fieldStr.substr(5,1);
  const subfieldsStr = fieldStr.substr(6);
  
  const subfields = _.tail(subfieldsStr.split('‡')).map(subfieldStr => ({
    code: subfieldStr.substr(0,1),
    value: subfieldStr.substr(1)
  }));

  return { tag, ind1, ind2, subfields };
}

function generateField(tag, subcode, content) {

  var field = {
    '$': {
      tag: tag
    },
    'subfield': []
  };

  if (_.isArray(content)) {
    content.forEach(addSubfield);
  } else {
    addSubfield(content);
  }

  return field;

  function addSubfield(content) {
    field.subfield.push({
      '$': { code: subcode },
      '_': content
    });
  }
}

function createField(tag, subcode) {
  return function(fieldContent) {
    return generateField(tag, subcode, fieldContent);
  };
}


function removeSubfields(func) {
  return function(field) {
    field.subfield = field.subfield.filter(function(subfield) {
      return !func(subfield);
    });
  };
}

function convertToISBN13(isbn) {
  if (isbn === undefined || isbn.length !== 10) {
    return isbn;
  }
  return addISBN13CheckDigit('978' + isbn.substring(0,9) );
}


function addISBN13CheckDigit(isbn) {
  if (isbn.length != 12) {
    throw new Error('ISBN13CheckDigit can only handle ISBN13 (without check digit)');
  }

  var sum = isbn.split('').reduce(function(memo, val, i) {
    var num = parseInt(val, 10);
    
    if (i%2 == 0) {
      memo += num;
    } else {
      memo += num*3;
    }

    return memo;
  }, 0);

  var checkDigit = 10 - (sum%10);

  if (checkDigit == 10) {
    checkDigit = 0;
  }
  isbn += checkDigit;

  return isbn;

}


function dateOfPublication(record) {

  var fields1 = select(['260..c'], record);

  if (fields1.length == 0) {

    var rec1_008 = _(record.controlfield).find(function(f) {return f.$.tag == '008'; } );
    
    if (rec1_008 === undefined) {
      throw new Error('Field 008 missing from record.');
    }
    
    var fields_from_008_1 = [rec1_008._.substr(7,4), rec1_008._.substr(11,4)].map(createField('008','a'));
    
    fields1 = fields1.concat(fields_from_008_1);
  }

  var normalized1 = normalize( fields1 , ['onlyYearNumbers', 'removeEmpty']);
  
  var set1 = normalized1;

  set1 = set1.map(function(field) {
    return _.map(field.subfield, '_');
  });
  set1 = _.chain(set1).flattenDeep().uniq().value();

  if (set1.length === 0) {
    return 9999;
  }

  return _.max(set1);

}

function subCode(subcode) {
  return function(subfield) {
    return (subfield.$.code == subcode);
  };
}

function actOnPublicationDate(year, action) {
  return function(record, fields, normalized) {
    if (dateOfPublication(record) < year) {
      normalized.forEach(action);
      fields.push(generateField(999, 'a', dateOfPublication(record)));
    }
  };
}


function getFields(set, selector) {

  var tag = selector.substr(0,3);
  var subcode = selector.substr(3,1);

  var fields = set.filter(function(field) {
    return field.$.tag == tag;
  });
  
  var retFields = clone(fields);
  retFields.forEach(function(field) {
    var subfields = field.subfield.filter(function(subfield) {
      return subfield.$.code == subcode;
    });

    field.subfield = subfields;

  });
  return retFields;

}

function getField(set, selector) {
  var tag = selector.substr(0,3);
  var subcode = selector.substr(3,1);

  var fields = set.filter(function(field) {
    return field.$.tag == tag;
  });
  
  if (fields.length > 1) {
    
    console.log('\nWarning: has multiple ' + selector + ':');

  }
  if (fields.length === 0) {
    return undefined;
  }
  var ret = clone(fields[0]);
  
  ret.subfield = ret.subfield.filter(function(subfield) {
    return subfield.$.code == subcode;
  });

  if (ret.subfield.length > 1) {
    throw new Error('field has multiple subfields of ' + selector);
  }
  if (ret.subfield.length === 0) {
    return undefined;
  }
  return ret.subfield[0]._; 
}

function parseISBN(fields) {
  fields.forEach(function(field) {
  
    var subfields = [];

    field.subfield.forEach(function(subfield) {
      var matches;

      matches = /([0-9]{13})/.exec(subfield._);
      if (matches !== null) {
        subfield._ = matches[1];
        subfields.push(subfield);
        return;
      }

      matches = /([0-9X]{10})/.exec(subfield._);
      if (matches !== null) {

        subfield._ = convertToISBN13(matches[1]);
        subfields.push(subfield);
        return;
      }
      
    });
    field.subfield = subfields;
  });

  return fields;
}

function toxmljsFormat(marcRecord) {

  var xmljsFormat = {
    controlfield: marcRecord.getControlfields().map(controlfieldFormatter),
    datafield: marcRecord.getDatafields().map(datafieldFormatter)
  };

  return xmljsFormat;

  function controlfieldFormatter(field) {

    return {
      $: {
        tag: field.tag
      },
      _: field.value
    };
  }
  function datafieldFormatter(field) {
  
    return {
      $: {
        tag: field.tag,
        ind1: field.ind1,
        ind2: field.ind2
      },
      subfield: field.subfields.map(subfieldFormatter)
    };
  }

  function subfieldFormatter(subfield) {
    return {
      $: {
        code: subfield.code,
      },
      _: subfield.value
    };
  }
}

module.exports = {
  normalize,
  singleNormalize,
  select,
  clone,
  filter,
  compare,
  hasSubfield,
  getSubfield,
  getSubfields,
  fieldToString,
  stringToField,
  toxmljsFormat,
  generateField,
  createField,
  removeSubfields,
  convertToISBN13,
  subCode,
  actOnPublicationDate,
  getFields,
  getField,
  parseISBN
};