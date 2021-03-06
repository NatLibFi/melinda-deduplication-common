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

import _ from 'lodash';
import uuid from 'uuid';

const FUTURE_HOST_ID_PLACEHOLDER = '(FI-MELINDA)[future-host-id]';

export function fieldHasSubfield(code, value) {
  const querySubfield = {code, value};

  return function (field) {
    return field.subfields.some(subfield => _.isEqual(subfield, querySubfield));
  };
}

export function selectFieldsByValue(record, tag, subcode, value) {
  return record.fields
    .filter(field => field.tag === 'SID')
    .filter(field => {
      return field.subfields.some(subfield => subfield.code === subcode && subfield.value === value);
    });
}

export function selectValues(record, tag, subcode) {
  return _.chain(record.fields)
    .filter(field => tag.equals ? tag.equals(field.tag) : tag === field.tag)
    .flatMap(field => field.subfields)
    .filter(subfield => subcode.equals ? subcode.equals(subfield.code) : subcode === subfield.code)
    .map(subfield => subfield.value)
    .filter(value => value !== undefined)
    .value();
}

export function selectRecordId(record) {
  const field001List = record.fields.filter(field => field.tag === '001');

  if (field001List.length === 0) {
    throw new Error('Could not parse record id');
  } else {
    return field001List[0].value;
  }
}

export function selectFirstValue(field, subcode) {
  if (field.subfields) {
    return _.chain(field.subfields)
      .filter(subfield => subcode.equals ? subcode.equals(subfield.code) : subcode === subfield.code)
      .map(subfield => subfield.value)
      .head()
      .value();
  }
  return field.value;
}

export function decorateFieldsWithUuid(record) {
  record.fields.forEach(field => {
    field.uuid = uuid.v4();
  });
}

export function resetRecordId(record) {
  record.fields = record.fields.filter(field => {
    return field.tag !== '001';
  });

  record.fields.unshift({
    uuid: uuid.v4(),
    tag: '001',
    value: '000000000'
  });
}

export function resetComponentHostLinkSubfield(field) {
  if (field.subfields) {
    const updatedSubfields = field.subfields.map(sub => {
      if (sub.code === 'w') {
        sub.value = FUTURE_HOST_ID_PLACEHOLDER;
      }
      return sub;
    });

    field.subfields = updatedSubfields;

    return field;
  }
  return field;
}

export function getLink(field) {
  const links = _.get(field, 'subfields', [])
    .filter(sub => sub.code === '6')
    .map(normalizeSub_6)
    .map(sub => sub.value)
    .map(link => link.split('-'));

  return _.head(links) || [];
}

function normalizeSub_6(subfield) {
  let {code, value} = subfield;
  if (subfield.code === '6') {
    value = _.head(value.split('/'));
  }
  return {code, value};
}

export function isLinkedFieldOf(queryField) {
  const [queryTag, queryLinkNumber] = getLink(queryField);

  return function (field) {
    const linkInLinkedField = getLink(field);
    const [linkTag, linkNumber] = linkInLinkedField;

    const fieldMatchesQueryLinkTag = field.tag === queryTag;
    const linkNumberMatchesQueryLinkNumber = linkNumber === queryLinkNumber;
    const linkTagLinksBackToQueryField = linkTag === queryField.tag;

    return fieldMatchesQueryLinkTag && linkNumberMatchesQueryLinkNumber && linkTagLinksBackToQueryField;
  };
}

export function fieldToString(field) {
  if (field && field.subfields) {
    const ind1 = field.ind1 || ' ';
    const ind2 = field.ind2 || ' ';
    const subfields = field.subfields.map(subfield => `‡${subfield.code}${subfield.value}`).join('');
    return `${field.tag} ${ind1}${ind2} ${subfields}`;
  }
  return `${field.tag}    ${field.value}`;
}
