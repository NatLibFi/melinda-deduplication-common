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