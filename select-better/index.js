const _ = require('lodash');
const extractors = require('./extractors');
const normalizers = require('./normalizers');

const ExtractorPreset = {
  Default: [
    { encodingLevel: extractors.encodingLevel },
    { publicationYear: extractors.publicationYear },
    { catalogingSourceFrom008: extractors.catalogingSourceFrom008 }, 
    { nonFinnishHELKA: extractors.nonFinnishHELKA }, 
    { FENNI: extractors.specificLocalOwner('FENNI') },
    { VIOLA: extractors.specificLocalOwner('VIOLA') },
    { TAISTO_ONLY: extractors.specificSingleLocalOwner('TAISTO') },
    { recordAge: extractors.recordAge },
    { reprintInfo: extractors.reprintInfo },
    { localOwnerCount: extractors.localOwnerCount },
    { FINL: extractors.specificFieldValue('040', ['a', 'd'], ['FI-NL']) },
    { f245c: extractors.specificField('245', ['c']) },
    { latestChange: extractors.latestChange((name) => !['LOAD', 'CARE', 'CONV', 'LINK'].some(robotName => name.includes(robotName))) },
    { field008nonEmptyCount: extractors.field008nonEmptyCount },
    { f100d: extractors.specificField('100', ['d']) },
  ]
};

const NormalizerPreset = {
  Default: [
    normalizers.lexical,
    normalizers.lexical,
    normalizers.lexical,
    normalizers.identity,
    normalizers.identity,
    normalizers.identity,
    normalizers.identity,
    normalizers.lexical,
    normalizers.reprint,
    normalizers.lexical,
    normalizers.identity,
    normalizers.identity,
    normalizers.lexical,
    normalizers.lexical,
    normalizers.lexical
  ]
};

function normalizeFeatureVectors(vector1, vector2, normalizers) {

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

function generateFeatures(record, extractors) {
  return _.flatMap(extractors, (extractor) => {
    return Object.keys(extractor).map(key => {
      return {
        name: key,
        value: extractor[key](record)
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
  ExtractorPreset,
  NormalizerPreset
};