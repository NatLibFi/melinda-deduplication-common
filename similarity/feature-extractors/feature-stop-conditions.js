const _ = require('lodash');
const { Labels } = require('./constants');

const {
  fromXMLjsFormat,
  selectValue,
  normalizeWith,
  normalizeText,
  expandAlias,
  isSubset,
  selectValues
} = require('./utils');

const publisher = require('./feature-publisher');
const ISBN = require('./feature-ISBN');

function isBookClub(publisherName) {
  return publisherName.includes('KIRJAKERHO');
}
const select008value = record => _.head(record.fields.filter(field => field.tag === '008').map(f => f.value));
const selectLanguage = (f008) => _.isString(f008) ? f008.substr(35,3) : f008;

function stopConditions(xmlJsrecord1, xmlJsrecord2) {
  const record1 = fromXMLjsFormat(xmlJsrecord1);
  const record2 = fromXMLjsFormat(xmlJsrecord2);
  
  const isbnMatch = ISBN(xmlJsrecord1, xmlJsrecord2).check();
  const publisherMatch = publisher(xmlJsrecord1, xmlJsrecord2).check();
  const nameOfPublisher = _.flow(selectValue('260', 'b'), normalizeWith(normalizeText, expandAlias));

  const language041 = _.flow(selectValues('041', 'a'), normalizeWith(arr => arr.map(normalizeText)));
  const language008 = _.flow(select008value, selectLanguage, normalizeText);
  
  const languageConsistent = record => language041(record).includes(language008(record));

  const names = ['isbn-publisher', 'isbn-bookclub', 'languages-different'];

  function check() {

    const isbnMismatch = isbnMatch === Labels.SURELY_NOT;
    const publisherMismatch = publisherMatch.slice(0,3)
      .filter(val => val !== null)
      .some(label => label === Labels.SURELY_NOT);
    
    const isbnAndPublisher = isbnMismatch && publisherMismatch;
    
    const publisherA = nameOfPublisher(record1);
    const publisherB = nameOfPublisher(record2);

    const bothAreBookClubs = isBookClub(publisherA) && isBookClub(publisherB);
    const isbnAndBookClub = (isBookClub(publisherA) || isBookClub(publisherB) && !bothAreBookClubs);
    
    const languagesAreSame = isSubset(language041(record1), language041(record2)) || isSubset(language041(record2), language041(record1));

    const languages = (languageConsistent(record1) && languageConsistent(record2) && !languagesAreSame);

    return [isbnAndPublisher, isbnAndBookClub, languages].map(val => val ? Labels.ABSOLUTELY_NOT_DOUBLE : null);
  }

  return {
    check: check,
    names: names
  };

}

module.exports = stopConditions;