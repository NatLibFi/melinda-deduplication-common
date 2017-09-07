const _ = require('lodash');
const extractors = require('./extractors');
const normalizers = require('./normalizers');

const ExtractorPreset = {
  Default: [
    { encodingLevel:    [ extractors.encodingLevel,     normalizers.lexical ] },
    { publicationYear:  [ extractors.publicationYear,   normalizers.lexical ] },
    { catalogingSourceFrom008: [ extractors.catalogingSourceFrom008, normalizers.lexical ] }, 
    { nonFinnishHELKA:  [ extractors.nonFinnishHELKA,   normalizers.identity ] }, 
    { FENNI:            [ extractors.specificLocalOwner('FENNI'), normalizers.identity ] },
    { VIOLA:            [ extractors.specificLocalOwner('VIOLA'), normalizers.identity ] },
    { TAISTO_ONLY:      [ extractors.specificSingleLocalOwner('TAISTO'), normalizers.identity ] },
    { VAARI_ONLY:       [ extractors.specificSingleLocalOwner('VAARI'), normalizers.identity ] },
    { recordAge:        [ extractors.recordAge,         normalizers.lexical ] },
    { reprintInfo:      [ extractors.reprintInfo,       normalizers.reprint ] },
    { localOwnerCount:  [ extractors.localOwnerCount,   normalizers.lexical ] },
    { FINL:             [ extractors.specificFieldValue('040', ['a', 'd'], ['FI-NL']), normalizers.identity ] },
    { f245c:            [ extractors.specificField('245', ['c']), normalizers.identity ] },
    { latestChange:     [ extractors.latestChange((name) => !['LOAD', 'CARE', 'CONV', 'LINK'].some(robotName => name.includes(robotName))), normalizers.lexical ] },
    { field008nonEmptyCount: [ extractors.field008nonEmptyCount,  normalizers.lexical ] },
    { f100d:            [ extractors.specificField('100', ['d']), normalizers.identity ] },
    { f130a:            [ extractors.specificField('130', ['a']), normalizers.identity ] }
  ]
};

function normalizeFeatureVectors(vector1, vector2, extractorSet) {

  const normalizers = extractorSet.map(extractor => _.head(_.values(extractor))).map(val => val[1]);

  const vector1copy = vector1.slice();
  const vector2copy = vector2.slice();

  normalizers.forEach(function(normalizerFunc, index) {

    if (typeof normalizerFunc !== 'function') {
      throw new Error(`normalizer '${normalizerFunc}' is not a function`);
    }

    vector1[index] = normalizerFunc(vector1copy[index], vector2copy[index]);
    vector2[index] = normalizerFunc(vector2copy[index], vector1copy[index]);

  });
}

function generateFeatures(record, extractorSet) {

  return _.flatMap(extractorSet, (extractor) => {
    return Object.keys(extractor).map(key => {
      return {
        name: key,
        value: extractor[key][0](record)
      };
    });
    
  });
}

function generateFeatureVector(features) {
  return features.map(feature => feature.value);
}

module.exports = {
  normalizeFeatureVectors,
  generateFeatures,
  generateFeatureVector,
  ExtractorPreset
};