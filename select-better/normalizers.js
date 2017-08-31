
const identity = (a) => a;

const lexical = (a, b) => a > b ? 1 : 0;

const notNull = (a, b) => b === null ? (a === null ? 0 : 1) : 0;

const invert = (a, b) => b;

const reprint = (a, b) => {  
  if (b.notesOnReprints.some(note => note.includes(a.year))) {
    return 0;
  }
  if (a.notesOnReprints.some(note => note.includes(b.year))) {
    return 1;
  }
  return 0;
};

module.exports = {
  lexical,
  notNull,
  invert,
  reprint,
  identity
};
