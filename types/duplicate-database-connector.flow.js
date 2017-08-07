// @flow

export type RecordIdentifier = {
  id: string,
  base: string
};

export type DuplicateDatabaseConfiguration = {
  endpoint: string,
  messageForDuplicateDatabase: string,
  priorityForDuplicateDatabase: number
}

export type DuplicateDatabaseConnector = {
  addDuplicatePair: (firstRecord: RecordIdentifier, secondRecord: RecordIdentifier) => Promise<any>,
};
