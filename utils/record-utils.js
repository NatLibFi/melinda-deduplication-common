const _ = require('lodash');
const toArabic = require('roman-numerals').toArabic;

function parsePageInfo(inputString) {
  if (!inputString) return null;

  const charactersToRemove = '[]';
  const charactersToSpaces = ',';
  // char -> char -> char -> boolean
  const characterBetween = (startChar, endChar) => {
    let insideParenthesis = false;
    return (char) => {
      if (char == startChar) {
        insideParenthesis = true;
        return false;
      } else if (char == endChar) {
        insideParenthesis = false;
        return false;
      } else {
        return !insideParenthesis;
      }
    };
  };

  const normalizedString = inputString.split('')
    .filter(char => !_.includes(charactersToRemove, char))
    .map(char => _.includes(charactersToSpaces, char) ? ' ' : char)
    .filter(characterBetween('(',')'))
    .join('');

  const unableToParse = normalizedString.split(' ').some(word => isNotAllowed(word.toLowerCase()));

  if (unableToParse) {
    return null;
  }

  // Match range ex. 123-534
  const rangeMatch = /(\d+)-(\d+)/.exec(normalizedString);
  
  if (rangeMatch != null) {
    
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);

    return {
      start: start,
      end: end,
      str: inputString,
      total: end-start
    };
  }

  const numbers = normalizedString
    .replace(/\D/g,' ')
    .replace(/\s+/g,' ')
    .split(' ')
    .map(n => parseInt(n, 10));
  
  const max_num = _.max(numbers);
  
  let preambleSize = parsePreambleSize(normalizedString);
  
  const start = 0;
  const end = max_num;
  return {
    start: start,
    end: end,
    str: inputString,
    total: end - start + preambleSize
  };

  // string -> number
  function parsePreambleSize(str) {
    let preambleSize = 0;
    str.split(' ').some(function(word) {
      try {
        preambleSize = toArabic(word);
        return true;
      } catch(e) {
        return false;
      }
    });
    return preambleSize;
  }

  // string -> bool
  function isNotAllowed(word) {

    const charsToRemove = ':.()[],-'.split('');

    const normalizedWord = word.split('')
      .filter(char => !_.includes(charsToRemove, char))
      .join('');

    const allowedPattern = /^[x|v|i|s|p|\d]*$/;

    return !allowedPattern.test(normalizedWord);
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
