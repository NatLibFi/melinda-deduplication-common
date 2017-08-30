// @flow

type ControlField = {
  tag: string,
  value: string
}

type Subfield = {
  code: string,
  value: string
}

type DataField = {
  tag: string,
  ind1: string,
  ind2: string,
  subfields: Array<Subfield>
}

type Field = ControlField | DataField;

export type MarcRecord = {
  leader: string,
  fields: Array<Field>,
  toString: () => string,
  appendField: (Array<string>) => void
};
