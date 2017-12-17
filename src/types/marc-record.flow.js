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

// @flow

export type ControlField = {
  tag: string,
  value: string
}

export type Subfield = {
  code: string,
  value: string
}

export type DataField = {
  tag: string,
  ind1: string,
  ind2: string,
  subfields: Array<Subfield>
}

export type Field = ControlField | DataField;

export type MarcRecord = {
  leader: string,
  fields: Array<Field>,
  toString: () => string,
  appendField: (Array<string>) => void,
  get: (RegExp) => Array<Field>
};