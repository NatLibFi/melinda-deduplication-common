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
import {type MarcRecord} from '../types/marc-record.flow';

const moment = require('moment');
const _ = require('lodash');
const debug = require('debug')('marc-record-utils');

function getLastModificationDate(record: MarcRecord): Date {
  const timestamp005 = _.get(record.fields.find(field => field.tag === '005'), 'value');

  if (timestamp005) {
    return moment(timestamp005, 'YYYYMMDDHHmmss.S').toDate();
  }

  debug('Could not parse timestamp from record', record.toString());
  return new Date(0);
}

module.exports = {
  getLastModificationDate
};
