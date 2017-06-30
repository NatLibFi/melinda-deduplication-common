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
    define([
      './converters/aleph-sequential',
      './converters/marc21slim-xml',
      './converters/iso2709'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./converters/aleph-sequential'),
      require('./converters/marc21slim-xml'),
      require('./converters/iso2709')
    );
  }

}(this, factory));

function factory(alephsequential, marc21slimXML, iso2709)
{

  'use strict';

  return {
    alephSequential: alephsequential,
    marc21slimXML: marc21slimXML,
    iso2709: iso2709
  };
  
}
