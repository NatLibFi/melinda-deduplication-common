/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file. 
*
* This project's source code is dual-licensed either under the terms of MIT License or Lesser GNU General Public License version 3.0 or any later version
*  
* MIT LICENSE:
*  
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*  
* The above copyright notice and this permission notice shall be included
* in all copies or substantial portions of the Software.
*  
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
* IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
* CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
* TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
* SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*  
*
* LESSER GNU GENERAL PUBLIC LICENSE:
*  
* W3C XML DOM that works in browsers and Node.js
*  
* Copyright (c) 2017 University Of Helsinki (The National Library Of Finland)
*  
* This file is part of xmldom-xplat.
*  
* xmldom-xplat is free software: you can redistribute it and/or modify
* it under the terms of the Lesser GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*  
* xmldom-xplat program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*  
* You should have received a copy of the Lesser GNU General Public License
* along with xmldom-xplat.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
**/

define(function() {

  'use strict';

  return {
    DOMImplementation: function() {
      return document.implementation;
    },
    DOMParser: DOMParser,
    XMLSerializer: XMLSerializer
  }
  
});
