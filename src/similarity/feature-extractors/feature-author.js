/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Shared modules for microservices of Melinda deduplication system
 *
 * Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-deduplication-common
 *
 * melinda-deduplication-common is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * melinda-deduplication-common is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 **/

const compareFuncs = require('./core.compare');
const { Labels } = require('./constants');

const _ = require('lodash');

const {
  normalize,
  select,
  clone,
  hasSubfield,
  generateField
} = require('./utils');

const debug = require('debug')('feature-author');


function author(record1, record2) {

  var fields1 = select(['100', '110', '111', '700', '710', '711'], record1);
  var fields2 = select(['100', '110', '111', '700', '710', '711'], record2);

  var normalized1 = normalize( clone(fields1) , ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'sortContent']);
  var normalized2 = normalize( clone(fields2) , ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs', 'sortContent']);


  var norm245c = ['toSpace("-")', 'delChars("\':,.")', 'trimEnd', 'upper', 'utf8norm', 'removediacs'];
  // There are authors in 245c too!

  var f245c1 = select(['245..c'], record1);
  var f245c2 = select(['245..c'], record2);
  // add 245c to fields so they are displayed for examination.
  fields1 = fields1.concat(f245c1);
  fields2 = fields2.concat(f245c1);

  // Parse authors from 245c into a single string.
  var a245c_authors1 = normalize(clone(f245c1), norm245c).map(toSubfieldValueArray);
  var a245c_authors2 = normalize(clone(f245c2), norm245c).map(toSubfieldValueArray);

  a245c_authors1 = _.flatten(a245c_authors1).join();
  a245c_authors2 = _.flatten(a245c_authors2).join();


  // Get author names into an array that have been found in author fields (100..711)
  var authorNames1 = _.flatten( normalized1.map(toSubfieldValueArray) );
  var authorNames2 = _.flatten( normalized2.map(toSubfieldValueArray) );

  // search authors from other records 245c
  var additionalAuthorsForRecord1 = searchAuthors(authorNames1, a245c_authors2);
  var additionalAuthorsForRecord2 = searchAuthors(authorNames2, a245c_authors1);

  normalized1 = normalized1.concat(additionalAuthorsForRecord1);
  normalized2 = normalized2.concat(additionalAuthorsForRecord2);

  function searchAuthors(authorNames, f245c_authors) {
  
    var additionalAuthorFields = [];
    authorNames = authorNames.filter(isNonEmpty);
    // Permutate all the names in the author fields
    authorNames.forEach(function(author) {
      var nameFragments = author.split(' ');

      var namePermutations;
      //permute name only if its only 5 or less words long.
      if (nameFragments.length < 6) {
        namePermutations = permute(nameFragments).map(function(set) { return set.join(' ');});
      } else {
        namePermutations = [author];
      }
      
      namePermutations.some(function(name) {
        
        if ( f245c_authors.indexOf(name) !== -1) {
          var field = [generateField(245,'c', name)];
          field = normalize(field, ['sortContent']);
          additionalAuthorFields.push( field[0] );
      
          return true;
        }
      });
    });

    return additionalAuthorFields;
  }

  var set1 = normalized1;
  var set2 = normalized2;

  function permute(set) {

    var permutations = [];
    var used = [];

    function generateFrom(set){
      var i, item;
      for (i = 0; i < set.length; i++) {
        item = set.splice(i, 1)[0];
        used.push(item);
        if (set.length === 0) {
          var copy = used.slice();
          permutations.push(copy);
        }
        generateFrom(set);
        set.splice(i, 0, item);
        used.pop();
      }
      return permutations;
    }

    return generateFrom(set);
  }

  function toSubfieldValueArray(field) {
    return field.subfield.reduce(function(memo, subfield) {
      memo.push(subfield._);
      return memo;
    }, []);
  }

  function getData() {
    return {
      fields: [fields1, fields2],
      normalized: [normalized1, normalized2]
    };
  }

  function check() {

    //if both are missing, we skip the step.
    if (set1.length === set2.length === 0) {
      return null;
    }

    //if other is missing, then we skip the step
    if (set1.length === 0 || set2.length === 0) {
      return null;
    }

    //if set1 or set2 dont have any a or c subfields, skip
    if (!hasSubfield(set1, 'a') || !hasSubfield(set2, 'a')) {
      return null;
    } 

    //if the sets are identical, we are sure
    if (compareFuncs.isIdentical(set1, set2)) {
      return Labels.SURE;
    }

    //if other set is subset of the other, then we are sure
    if (compareFuncs.isSubset(set1, set2) || compareFuncs.isSubset(set2, set1)) {
      return Labels.SURE;
    }

    // if one set has strings that are contained is the set of other strings
    // node sim.js author ../data/000926333.xml ../data/002407930.xml
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.stringPartofComparator)) {
      debug('isIdentical stringPartofComparator');
      return Labels.SURE;
    }			

    // if sets are identical with abbreviations, we are sure
    // Example: node sim.js author ../data/000007962.xml ../data/000631874.xml
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.abbrComparator)) {
      debug('isIdentical abbrComparator');
      return Labels.SURE;
    }
    
    // if sets are identical with jaccard, we are sure
    // Example: node sim.js author ../data/000040468.xml ../data/003099068.xml
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.jaccardComparator(0.66))) {
      debug('isIdentical jaccardComparator0.66');
      return Labels.ALMOST_SURE;
    }

    // TODO: if sets are identical with lv-distance, we are almost sure
    // example: > node sim.js author ../data/000021724.xml ../data/001073242.xml
    if (compareFuncs.isIdentical(set1, set2, compareFuncs.lvComparator(0.75))) {
      debug('isIdentical lvComparator.75');
      return Labels.ALMOST_SURE;
    }
    //if other set is subset of the other with small lv-distance, then we are sure
    if (compareFuncs.isSubset(set1, set2, compareFuncs.lvComparator(0.75)) || 
      compareFuncs.isSubset(set2, set1, compareFuncs.lvComparator(0.75))) {

      debug('isSubset lvComparator.75');
      return Labels.ALMOST_SURE;
    }

    //if the sets have a single identical entry, (but some non-identical entries too) we are almost sure
    if (compareFuncs.intersection(set1, set2).length > 0) {
      return Labels.MAYBE;
    }

    //if other set is subset of the other with small lv-distance, then we are sure
    if (compareFuncs.isSubset(set1, set2, compareFuncs.stringPartofComparator) || 
      compareFuncs.isSubset(set2, set1, compareFuncs.stringPartofComparator)) {
      debug('isSubset stringPartofComparator');
      return 0.6; //SOMEWHAT_SURE?
    }

    // false positive: node sim.js author ../data/000662146.xml ../data/003106685.xml
    if (compareFuncs.isSubset(set1, set2, compareFuncs.abbrComparator) || 
      compareFuncs.isSubset(set2, set1, compareFuncs.abbrComparator)) {
      debug('isSubset abbrComparator');
      return 0.6; //SOMEWHAT_SURE?
    }

    //if other set is subset of the other with jaccard, then we are sure
    if (compareFuncs.isSubset(set1, set2, compareFuncs.jaccardComparator(0.75)) || 
      compareFuncs.isSubset(set2, set1, compareFuncs.jaccardComparator(0.75))) {
      debug('isSubset jaccardComparator.75');
      return 0.6; //SOMEWHAT_SURE?
    }
  
    // test for lv distanced names
    
    // Otherwise suggest that these are different records.
    return Labels.SURELY_NOT;
  }

  return {
    check: check,
    getData: getData
  };
}

function isNonEmpty(value) {
  if (value === undefined || value === null) { 
    return false; 
  }

  if (value === '') { 
    return false; 
  }

  return true;
}


module.exports = author;