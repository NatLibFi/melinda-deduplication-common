// @flow
import type { MarcRecord } from 'types/marc-record.flow';

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