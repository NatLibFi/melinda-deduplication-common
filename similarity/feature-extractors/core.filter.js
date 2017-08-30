var _ = require('lodash');

function clone(a) {
  return JSON.parse(JSON.stringify(a));
}

function stringSelector(selector, record) {
  record = clone(record);
  
  if (selector.length >= 3) {
    while (selector.length < 5) {
      selector += '.';
    }
    //tag selector
    var res = [];
    
    res = res.concat(record.controlfield.map(hTag(selector)));
    res = res.concat(record.datafield.map(hTag(selector)));
    
    return res;
  }
}

function hTag(selector) {
  return function(field) {
    
    var res = [];
    var sel = selector.substr(0,3);
    var ind1 = selector.substr(3,1);
    var ind2 = selector.substr(4,1);
    var subfields = selector.substr(5);

    if (field.$.tag == sel) {
      if (new RegExp('^'+ind1+'?$').test(field.$.ind1) && 
        new RegExp('^'+ind2+'?$').test(field.$.ind2)) {
        
        filterSubfields(field, subfields);

        res.push(field);
      }
    }
    return res;
  };
}

function filterSubfields(field, subfields) {
  if (subfields === '') {
    return;
  }

  subfields = subfields.split('');

  var unSelectedSubfields = field.subfield.filter(function(subfield) {
    return (subfields.indexOf(subfield.$.code) == -1);
  });
  field.subfield = _.difference(field.subfield, unSelectedSubfields);

}

module.exports = {
  stringSelector: stringSelector
};
