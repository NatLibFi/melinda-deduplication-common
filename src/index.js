// @flow
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
import {MarcRecord} from '@natlibfi/marc-record';
import * as DefaultConfigs from './default-configs';
import * as MarcRecordMergeUtils from './marc-record-merge-utils';
import * as SelectBetter from './select-better';
import * as Similarity from './similarity';
import * as Types from './types';
import * as Utils from './utils';

MarcRecord.setValidationOptions({subfieldValues: false});

export {
  DefaultConfigs,
  MarcRecordMergeUtils,
  SelectBetter,
  Similarity,
  Types,
  Utils
};
