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
    define(['marc-record-js', 'xmldom-xplat'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('marc-record-js'), require('xmldom-xplat'));
  }

}(this, factory));

function factory(MarcRecord, xmldom)
{

  'use strict';

  var MARC21SLIM_NAMESPACE = 'http://www.loc.gov/MARC21/slim',
      NODE_TYPE = {
        text_node: 3
      };

  function convertToXML(record_data)
  {

    function mkDatafield(field) {
      
      var datafield = mkElement('datafield');

      datafield.setAttribute('tag', field.tag);
      datafield.setAttribute('ind1', formatIndicator(field.ind1));
      datafield.setAttribute('ind2', formatIndicator(field.ind2));

      field.subfields.forEach(function(subfield) {

        var sub = mkElementValue('subfield', subfield.value);

        sub.setAttribute('code', subfield.code);
        datafield.appendChild(sub);

      });

      return datafield;

    }

    function formatIndicator(ind) {
      return ind == '_' ? ' ' : ind;
    }

    function mkElementValue(name, value) {

      var el = mkElement(name),
          t = xmldoc.createTextNode(value);

      el.appendChild(t);

      return el;

    }

    function mkElement(name) {
      return xmldoc.createElement(name);
    }

    function mkControlfield(tag, value) {

      var cf = mkElement('controlfield'),
          t = xmldoc.createTextNode(value);

      cf.setAttribute('tag', tag);
      cf.appendChild(t);

      return cf;

    }
    
    function convertRecord(record)
    {
      
      var xml = mkElement('record'),
          leader = mkElementValue('leader', record.leader);

      xml.setAttribute('xmlns', MARC21SLIM_NAMESPACE);
      xml.appendChild(leader);
      
      record.getControlfields().forEach(function(field) {
        xml.appendChild(mkControlfield(field.tag, field.value));
      });
      
      record.getDatafields().forEach(function(field) {
        xml.appendChild(mkDatafield(field));
      });

      return xml;
      
    }

    var xmldoc = new xmldom.DOMImplementation().createDocument(),
        doc = Array.isArray(record_data) ? record_data.map(convertRecord).reduce(function(product, item) {

          product.appendChild(item);
          return product;
          
        }, xmldoc.createElement('collection'))
        : convertRecord(record_data);
    
    return new xmldom.XMLSerializer().serializeToString(doc);

  }

  function convertFromXML(str)
  {

    function getRecords(offset, records)
    {

      function notTextNode(node) {
        return node.nodeType !== NODE_TYPE.text_node;
      }

      function handleLeaderNode(node) {
        if (node.childNodes[0] !== undefined && node.childNodes[0].nodeType === NODE_TYPE.text_node && node.childNodes[0].data.trim().length > 0) {
          record.leader = node.childNodes[0].data;
        } else {
          throw new Error('Record has invalid leader');
        }
      }

      function handleControlfieldNode(node) {
        
        var value,
            tag = node.getAttribute('tag');

        if (node.childNodes[0] !== undefined && node.childNodes[0].nodeType === NODE_TYPE.text_node) {
          value = node.childNodes[0].data;
          record.appendControlField([tag, value]);
        } else {
          throw new Error('Unable to parse controlfield: ' + tag);
        }

      }

      function handleDatafieldNode(node) {

        var tag = node.getAttribute('tag'),
            ind1 = node.getAttribute('ind1'),
            ind2 = node.getAttribute('ind2'),
            subfields  = Array.prototype.slice.call(node.childNodes).filter(notTextNode).map(function(subfieldNode) {
              
              var code = subfieldNode.getAttribute('code');
              var text = getChildTextNodeContents(subfieldNode).join('');

              return {
                code: code,
                value: text
              };

            });

        record.appendField({
          tag: tag,
          ind1: ind1,
          ind2: ind2,
          subfields: subfields
        });

      }
      
      function getChildTextNodeContents(node) {
        
        var nodes_child = Array.prototype.slice.call(node.childNodes),
            nodes_text = nodes_child.filter(function(node) {
              return node.nodeType === NODE_TYPE.text_node;
            });

        return nodes_text.map(function(node) {
          return node.data;
        });

      }

      var nodes_child, node_record,
          record = new MarcRecord();

      offset = offset === undefined ? 0 : offset;
      records = records === undefined ? [] : records;     

      node_record = nodes_record.item(offset);
      
      if (node_record === undefined) {
        return records;
      } else {

        nodes_child = (node_record !== undefined) ?  Array.prototype.slice.call(node_record.childNodes) : [];

        nodes_child.filter(notTextNode).forEach(function(node) {
          switch (node.localName) {
          case 'leader':
            handleLeaderNode(node);
            break;
          case 'controlfield':
            handleControlfieldNode(node);
            break;
          case 'datafield':
            handleDatafieldNode(node);
            break;
          case 'recordTypeType':
          case 'id':
            break;
          default:
            throw new Error('Unable to parse node: ' + node.localName);
          }
        });

        return getRecords(offset + 1, records.concat(record));

      }

    }
    
    var nodes_record,
        xmldoc = new xmldom.DOMImplementation().createDocument(),
        xml = new xmldom.DOMParser().parseFromString(str);
    
    try {
      nodes_record = xml.getElementsByTagNameNS(MARC21SLIM_NAMESPACE, 'record');
      nodes_record = nodes_record.length === 0 ? xml.getElementsByTagName('record') : nodes_record;
    } catch (e) {
      throw new Error('Invalid XML object');
    }

    if (nodes_record.length === 0) {
      throw new Error('No records found in XML');
    } else {
      return getRecords().reduce(function(product, item) {
        return Array.isArray(product) ? product.concat(item) : [product, item];
      });
    }

  }

  return {
    from: convertFromXML,
    to: convertToXML
  };

}
