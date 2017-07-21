// @flow

type DuplicatePairItem = {|
  id: string,
  base: string,
  term: string  
|};

export type Duplicate = {|
  first: DuplicatePairItem,
  second: DuplicatePairItem,
  probability: number
|};
