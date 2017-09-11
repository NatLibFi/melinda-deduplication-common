const _ = require('lodash');

const format = `
BK
18,4 - Illustrations 
22 - Target audience 
23 - Form of item 
24,4 - Nature of contents 
28 - Government publication 
29 - Conference publication 
30 - Festschrift 
31 - Index 
33 - Literary form 
34 - Biography 

CF
22 - Target audience 
23 - Form of item 
26 - Type of computer file 
28 - Government publication 

MP
18,4 - Relief 
22,2 - Projection 
25 - Type of cartographic material 
28 - Government publication 
29 - Form of item 
31 - Index 
33,2 - Special format characteristics	

MU
18,2 - Form of composition
20 - Format of music 
21 - Music parts 
22 - Target audience 
23 - Form of item 
24,6 - Accompanying matter 
30,2 - Literary text for sound recordings 
33 - Transposition and arrangement 

CR
18 - Frequency 
19 - Regularity 
21 - Type of continuing resource 
22 - Form of original item 
23 - Form of item 
24 - Nature of entire work 
25,3 - Nature of contents 
28 - Government publication 
29 - Conference publication 
33 - Original alphabet or script of title 
34 - Entry convention 

VM
18,3 - Running time for motion pictures and videorecordings 
22 - Target audience 
28 - Government publication 
29 - Form of item 
33 - Type of visual material 
34 - Technique 

MX
23 - Form of item
`;

const f = format.trim().split('\n\n').map(formatString => {
  const lines = formatString.split('\n');
  const code = _.head(lines);
  const extractors = _.tail(lines).map(extractorLine => {
    const [position, name] = extractorLine.split('-');
    const [start, count=1] = position.split(',');
    const extractor = (str) => str.substr(start, count);

    const normalizedName = `${code}-${name.trim()}`;

    return { extractor, name: normalizedName };
  });

  return { code, extractors };
});

module.exports = f;