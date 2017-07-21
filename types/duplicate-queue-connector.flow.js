// @flow

import type { Duplicate } from './duplicate.flow';

export type DuplicateDoneCallback = () => mixed;
export type OnDuplicate = (duplicate: Duplicate, done: DuplicateDoneCallback) => mixed;

export type DuplicateQueueConnector = {
  pushDuplicate: (duplicate: Duplicate) => Promise<any>,
  listenForDuplicates: (onDuplicate: OnDuplicate) => Promise<any>
};
