const _ = require('lodash');
const toArabic = require('roman-numerals').toArabic;

function parsePageInfo(str) {
  if (!str) return null;

  var remove = '[]'.split('');
  var tospace = ','.split('');

  remove.forEach(function(char) {
    str = str.replace(new RegExp(RegExp.escape(char)), '');
  });

  tospace.forEach(function(char) {
    str = str.replace(new RegExp(RegExp.escape(char)), ' ');
  });

  str = str.replace(/\([^\)]\)/g, ' ');

  var unparseable = str.split(' ').some(function(word) {
    return isNotAllowed(word.toLowerCase());
  });

  if (unparseable) {
    return null;
  }

  var rangeMatch = /(\d+)-(\d+)/.exec(str);
  
  if (rangeMatch != null) {
    
    var start = parseInt(rangeMatch[1], 10);
    var end = parseInt(rangeMatch[2], 10);

    return {
      start: start,
      end: end,
      str: str,
      total: end-start
    };
  }

  // no?
  var numbers = str.replace(/\D/g,' ').replace(/\s+/g,' ').split(' ');
  numbers = numbers.map(function(n) { return parseInt(n, 10); });
  
  var max_num = _.max(numbers);
  
  var preambleSize = 0;
  
  str.split(' ').some(function(word) {
    try {
      preambleSize = toArabic(word);
      return true;
    } catch(e) {
      return false;
    }
  });

  start = 0;
  end = max_num;
  return {
    start: start,
    end: end,
    str: str,
    total: end-start+preambleSize
  };

  function isNotAllowed(word) {
    var removedChars = ':.()[],-'.split('');
    removedChars.forEach(function(char) {
      word = word.replace(new RegExp(RegExp.escape(char)), '');
    });

    var allowedPattern = /^[x|v|i|s|p|\d]*$/;

    return !allowedPattern.test(word);
  }
}

// str -> [number]
function parseYears(str) {
  if (!str) return [];

  // keeps only words that are 4 characters long and between 1000 and 2100 (exclusive)
  return str.split(/\D/).filter(isYear).sort();

  function isYear(str) {
    if (str.length != 4) return false;
    if (isNaN(str)) return false;
    var number = parseInt(str, 10);

    return number < 2100 && number > 1000;
  }
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

module.exports = { 
  parsePageInfo,
  parseYears,
  fieldToString,
  stringToField
};
