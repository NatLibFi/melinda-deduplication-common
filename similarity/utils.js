const MarcRecord = require('marc-record-js');

const RecordSimilarity = require('./similarity');
const DEFAULT_STRATEGY = require('./similarity-strategy');

function pairToInputVector(pair) {
 
  const featureVector = pairToFeatureVector(pair);
  const inputVector = featureVectorToInputVector(featureVector);
  return inputVector;
}

function featureVectorToInputVector(featureVector) {

  const input = Object.keys(featureVector).map(key => {
    if (featureVector[key]) {
      return featureVector[key] * 2 - 1;
    } else {
      return 0;
    }
  });
  
  return input;
}

function pairToFeatureVector(pair, strategy = DEFAULT_STRATEGY) {
  const record1 = MarcRecord.clone(pair.record1);
  const record2 = MarcRecord.clone(pair.record2);
  
  const featureVector = RecordSimilarity.extractFeatures(strategy, record1, record2);

  return featureVector;
}

const Types = {
  TRUE_POSITIVE: 'TRUE_POSITIVE',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
  TRUE_NEGATIVE: 'TRUE_NEGATIVE',
  FALSE_NEGATIVE: 'FALSE_NEGATIVE'
};


const DuplicateClass = {
  IS_DUPLICATE: 'IS_DUPLICATE',
  NOT_DUPLICATE: 'NOT_DUPLICATE',
  MAYBE_DUPLICATE: 'MAYBE_DUPLICATE'
};


module.exports = {
  pairToInputVector,
  featureVectorToInputVector,
  pairToFeatureVector,
  Types,
  DuplicateClass,
  DefaultStrategy: DEFAULT_STRATEGY
};
