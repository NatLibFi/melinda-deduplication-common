const MarcRecord = require('marc-record-js');

const RecordSimilarity = require('../marc-record-similarity');

const strategy = require('../src/similarity-strategy');

const options = {
  strategy: strategy
};

const similarity = new RecordSimilarity(options);

function pairToInputVector(pair) {
 
  const featureVector = pairToFeatureVector(pair);
  const inputVector = featureVectorToInputVector(featureVector);
  return inputVector;
}

function featureVectorToInputVector(featureVector) {

  const input = Object.keys(featureVector).map(key => {
    if (featureVector[key]) {
      return featureVector[key] * 2 -1;
    } else {
      return 0;
    }
  });
  return input;

}

function pairToFeatureVector(pair) {
  const record1 = MarcRecord.clone(pair.record1);
  const record2 = MarcRecord.clone(pair.record2);
  
  const featureVector = similarity.generateFeatureVector(record1, record2);

  return featureVector;
}

const Types = {
  TRUE_POSITIVE: 'TRUE_POSITIVE',
  FALSE_POSITIVE: 'FALSE_POSITIVE',
  TRUE_NEGATIVE: 'TRUE_NEGATIVE',
  FALSE_NEGATIVE: 'FALSE_NEGATIVE'
};


module.exports = {
  pairToInputVector,
  featureVectorToInputVector,
  pairToFeatureVector,
  Types
};
