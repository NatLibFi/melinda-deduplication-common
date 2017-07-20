// @flow

type DuplicatePairItem = {|
  id: string,
  base: string,
  term: string  
|};

export type DuplicateCandidate = {|
  first: DuplicatePairItem,
  second: DuplicatePairItem  
|};
