// @flow

export type RecordIdentifier = {
  id: String,
  base: String
};

export type DuplicateDatabaseConnector = {
  addDuplicatePair: (firstRecord: RecordIdentifier, secondRecord: RecordIdentifier) => Promise<any>,
};
