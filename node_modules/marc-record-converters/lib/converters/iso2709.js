/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * ISC License
 *  
 * Modified work: Copyright (c) 2015, 2017 University Of Helsinki (The National Library Of Finland)  
 * Original work: Copyright (c) 2015 Pasi Tuominen
 *  
 * Permission to use, copy, modify, and/or distribute this software for
 * any purpose with or without fee is hereby granted, provided that the
 * above copyright notice and this permission notice appear in all
 * copies.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *  
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

/* istanbul ignore next: umd wrapper */
(function(root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['marc-record-js'], factory);
} else if (typeof module === 'object' && module.exports) {
  module.exports = factory(require('marc-record-js'));
}

}(this, factory));


function factory(MarcRecord, xmldom)
{


  /**
   * Returns the entire directory starting at position 24. Control character '\x1E' marks the end of directory
   */
  function parseDirectory(data_str)
  {

    var curr_char = '',
        directory = '',
        pos = 24;

    while (curr_char !== '\x1E') {
      curr_char = data_str.charAt(pos);
      if (curr_char !== 'x1E')
        directory += curr_char;
      pos++;
      
      if (pos > data_str.length) {
        throw new Error('Invalid record');
      }
    }
    
    return directory;

  }

  /**
   * Returns an array of 12-character directory entries.
   */
  function parseDirectoryEntries(directory_str)
  {

    var directory_entries = [],
        pos = 0,
        count = 0;
    
    while (directory_str.length - pos >= 12) {
      directory_entries[count] = directory_str.substring(pos, pos + 12);
      pos += 12;
      count++;
    }

    return directory_entries;
  }
  
  /**
   * Removes leading zeros from a numeric data field.
   */
  function trimNumericField(input)
  {
    while (input.length > 1 && input.charAt(0) === '0') {
      input = input.substring(1);
    }
    
    return input;

  }

  function dirFieldTag(directory_entry)
  {
    return directory_entry.substring(0, 3);
  }
  
  function dirFieldLength(directory_entry)
  {
    return directory_entry.substring(3, 7);
  }
  
  function dirStartingCharacterPosition(directory_entry)
  {
    return directory_entry.substring(7, 12);
  }

  /**
   * Returns a UTF-8 substring
   */
  function substrUTF8(str, start_in_bytes, length_in_bytes)
  {

    var str_bytes = stringToByteArray(str),
        substr_bytes = [],
        count = 0;
    
    for (var i = start_in_bytes; count < length_in_bytes; i++) {
      substr_bytes.push(str_bytes[i]);
      count++;
    }
    
    return byteArrayToString(substr_bytes);

  }
  
  /**
   * Converts the input UTF-8 string to a byte array. From http://stackoverflow.com/questions/1240408/reading-bytes-from-a-javascript-string?lq=1
   */
  function stringToByteArray(str)
  {

    var encoded_chars,
        byte_array = [];
    
    for (var i = 0; i < str.length; i++)

      if (str.charCodeAt(i) <= 0x7F) {
        byte_array.push(str.charCodeAt(i));
      } else {

        encoded_chars = encodeURIComponent(str.charAt(i)).substr(1).split('%');

        for (var j = 0; j < encoded_chars.length; j++) {
          byte_array.push(parseInt(encoded_chars[j], 16));
        }
        
      }
    
    return byte_array;
    
  }

  /**
   * Converts the byte array to a UTF-8 string. From http://stackoverflow.com/questions/1240408/reading-bytes-from-a-javascript-string?lq=1
   */
  function byteArrayToString(byte_array)
  {

    var str = '';
    
    for (var i = 0; i < byte_array.length; i++) {
      str += byte_array[i] <= 0x7F ? byte_array[i] === 0x25 ? "%25" : String.fromCharCode(byte_array[i]) : "%" + byte_array[i].toString(16).toUpperCase();
    }
    
    return decodeURIComponent(str);
    
  }


  /**
   * Adds leading zeros to the specified numeric field
   */
  function addLeadingZeros(num_field, length)
  {

    while (num_field.toString().length < length) {
      num_field = "0" + num_field.toString();
    }
    
    return num_field;
    
  }

  /**
   * Returns the length of the input string in UTF8 bytes
   */
  function lengthInUtf8Bytes(str)
  {

    var match = encodeURIComponent(str).match(/%[89ABab]/g);  
    return str.length + ( match ? match.length : 0);
    
  }

  function convertFromISO2709(record_data)
  {

    function convertRecord(record_str)
    {
      
      /**
       * Parse directory section
       */
      var directory = parseDirectory(record_str),
          directory_entries = parseDirectoryEntries(directory),
          /**
           * Locate start of data fields (First occurrence of '\x1E')
           */
          data_start_pos = record_str.search('\x1E') + 1,
          data_field_str = record_str.substring(data_start_pos),
          record = {
            leader: record_str.substring(0, 24),
            fields: []
          };
      
      function processDirectoryEntry(entry)
      {
        
        var field_element_str, data_element_str, datafield;      
        var tag = dirFieldTag(entry),
            /**
             * NOTE: fieldLength is the number of UTF-8 bytes in a string
             */
            field_length = trimNumericField(dirFieldLength(entry)),
            start_char_pos = trimNumericField(dirStartingCharacterPosition(entry));


        function processDataElement(str)
        {

          var code, ind1, ind2;
          var curr_element_str = '';
          
          str.split('').forEach(function(item, index, arr) {
            
            /**
             * '\x1F' begins a new subfield, '\x1E' ends all fields
             */
            if (item === '\x1F' || item.charAt(index) === '\x1E' || index === arr.length - 1) {
              if (curr_element_str !== "") {

                curr_element_str = index === arr.length - 1 ? curr_element_str + item : curr_element_str;
                
                /**
                 * Parse code attribute
                 */
                code = curr_element_str.charAt(0);
                curr_element_str = curr_element_str.substring(1);

                /**
                 * Remove trailing control characters
                 **/
                if (curr_element_str.charAt(curr_element_str.length - 1) === '\x1F' || curr_element_str.charAt(curr_element_str.length - 1) === '\x1E') {
                  curr_element_str = curr_element_str.substring(0, curr_element_str.length - 1);
                }

                /**
                 * Create a <subfield> element              
                 **/
                datafield.subfields.push({
                  code: code,
                  value: curr_element_str
                });
                curr_element_str = "";
                
              }
            } else {
              curr_element_str += item;
            }
          });
        }
        
        /**
         * Append control fields for tags 00X
         */
        if (tag.substring(0, 2) == '00') {
          
          field_element_str = data_field_str.substring(start_char_pos, parseInt(start_char_pos, 10) + parseInt(field_length, 10) - 1);
          
          record.fields.push({
            tag: tag,
            value: field_element_str
          });
          
          /**
           * Otherwise append a data field
           */
        } else {
          
          data_element_str = substrUTF8(data_field_str, parseInt(start_char_pos, 10), parseInt(field_length, 10));
          
          if (data_element_str[2] !== '\x1F')
            data_element_str = data_field_str[start_char_pos - 1] + data_element_str;

          /**
           * Parse indicators and convert '\x1F' characters to spaces for valid XML output
           */
          ind1 = data_element_str.charAt(0);
          ind1 = ind1 == '\x1F' ? ' ' : ind1;
          
          ind2 = data_element_str.charAt(1);
          ind2 = ind2 == '\x1F' ? ' ' : ind2;

          /**
           * Create a <datafield> element                
           */
          datafield = {
            tag: tag,
            ind1: ind1,
            ind2: ind2,
            subfields: []
          };

          /**
           * Parse all subfields
           **/
          data_element_str = data_element_str.substring(2);

          /**
           * Bypass indicators
           */
          processDataElement(data_element_str);

          record.fields.push(datafield);

        }
        
      }
      
      /**
       * Loop through directory entries to read data fields
       **/
      directory_entries.forEach(processDirectoryEntry);
      return new MarcRecord(record);

    }

     /**
      * The last element will always be empty because records end in char 1D
      */
    return record_data.split(/\x1D/).slice(0, -1).map(convertRecord).reduce(function(product, item) {
      return Array.isArray(product) ? product.concat(item) : [product, item];
    });
    
  }


  function convertToISO2709(record_data)
  {

    function convertRecord(record)
    {
    
    var record_str = '',
        directory_str = '',
        datafield_str = '',
        leader = record.leader,
        char_pos = 0;
    
    record.getControlfields().forEach(function(field) {
      
      directory_str += field.tag;
      
      if (field.value === undefined || field.value === '') {
        /**
         * Special case: control field contents empty
         */
        directory_str += addLeadingZeros(1, 4);
        directory_str += addLeadingZeros(char_pos, 5);
        char_pos++;
        datafield_str += '\x1E';
      } else {
        directory_str += addLeadingZeros(field.value.length + 1, 4);
        /**
         * Add character position
         */
        directory_str += addLeadingZeros(char_pos, 5);
        /**
         * Advance character position counter
         */
        char_pos += lengthInUtf8Bytes(field.value) + 1;
        datafield_str += field.value + '\x1E';
      }

    });
    
    record.getDatafields().forEach(function(field) {

      var curr_datafield = '',
          tag = field.tag,
          ind1 = field.ind1,
          ind2 = field.ind2;

      /**
       *Add tag to directory
       */
      directory_str += tag;

      /**
       * Add indicators
       */
      datafield_str += ind1 + ind2 + '\x1F';

      field.subfields.forEach(function(subfield, index) {
        
        var subfield_str = subfield.code + subfield.value;

        /**
         * Add terminator for subfield or data field
         */
        subfield_str += index === field.subfields.length - 1 ? '\x1E' : '\x1F';
        curr_datafield += subfield_str;

      });

      datafield_str += curr_datafield;

      /**
       * Add length of field containing indicators and a terminator (3 characters total)
       */
      directory_str += addLeadingZeros(stringToByteArray(curr_datafield).length + 3, 4);

      /**
       * Add character position
       */
      directory_str += addLeadingZeros(char_pos, 5);
      /**
       * Advance character position counter
       */
      char_pos += lengthInUtf8Bytes(curr_datafield) + 3;
      
    });

    var new_str_length, new_base_addr_pos;
    
    /**
     * Recalculate and write new string length into leader
     */
    new_str_length = stringToByteArray(leader + directory_str + '\x1E' + datafield_str + '\x1D').length;
    leader = addLeadingZeros(new_str_length, 5) + leader.substring(5);
    
    /**
     * Recalculate base address position
     **/
    new_base_addr_pos = 24 + directory_str.length + 1;
    leader = leader.substring(0, 12) + addLeadingZeros(new_base_addr_pos, 5) + leader.substring(17);
    
    record_str += leader + directory_str + '\x1E' + datafield_str + '\x1D';
    
    return record_str;

    }

    return Array.isArray(record_data) ? record_data.reduce(function(product, item) {
      return product + convertRecord(item);
    }, '') : convertRecord(record_data);
    
  }

  return {
    to: convertToISO2709,
    from: convertFromISO2709
  };

}
