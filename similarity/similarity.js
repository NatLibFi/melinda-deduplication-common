
const _ = require('lodash');
const { toxmljsFormat } = require('./feature-extractors/utils');
const FeatureExtractors = require('./feature-extractors');

function extractFeatures(strategy, record1, record2) {

  const XMLJSrecord1 = toxmljsFormat(record1);
  const XMLJSrecord2 = toxmljsFormat(record2);

  const featureExtractionResult = executeFeatureExtractors(strategy, XMLJSrecord1, XMLJSrecord2);

  return featureExtractionResult.reduce((memo, item) => _.set(memo, item.name, item.similarity), {});
}

function executeFeatureExtractors(strategy, record1, record2) {
  
  return strategy.map(function(extractorDefinition) {
    const Extractor = FeatureExtractors[extractorDefinition.name];
    const extractorInstance = new Extractor(record1, record2);
    
    const featureSimilarity = extractorInstance.check();
    
    return {
      name: extractorDefinition.name,
      similarity: featureSimilarity
    };
  });
}

module.exports = {
  extractFeatures
};
