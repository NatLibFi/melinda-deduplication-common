/*jshint node:true */

const {
  toxmljsFormat,
} = require('./utils');

const FeatureExtractors = require('./index');

function Similarity(strategy) {

  function extractFeatures(record1, record2) {

    record1 = toxmljsFormat(record1);
    record2 = toxmljsFormat(record2);

    var featureExtractionResult = executeFeatureExtractors(record1, record2);

    return featureExtractionResult.reduce(function(memo, item) {
      memo[item.name] = item.similarity;
      return memo;
    }, {});
  }

  function executeFeatureExtractors(record1, record2) {
    
    var featureExtractors = strategy.map(function(extractorDefinition) {
      var Extractor = FeatureExtractors[extractorDefinition.name];
      
      var extractorInstance = new Extractor(record1, record2);
      
      extractorInstance.name = extractorDefinition.name;

      return extractorInstance;
    });

    return featureExtractors.map(function(extractor) {
      
      var similarity = extractor.check();
      
      return {
        name: extractor.name,
        similarity: similarity
      };
    });
  }

  this.extractFeatures = extractFeatures;
}

module.exports = Similarity;
