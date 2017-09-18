It removes duplicate fields
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.



It removes triplicate etc. fields
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.



It removes duplicate fields with subset comparison
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.



It removes duplicate fields with subset and substring comparison
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-2003.



It does not remove duplicate fields if multiple subsets are substrings
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bvesi,‡c2002-2003.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bvesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aHelsinki :‡bvesi,‡c2002-2003.
260    ‡aHelsinki :‡bHelsingin vesi,‡c2002-



It does not remove duplicate 080 fields
Preferred record:
LDR    00000_a____
001    28474
080    ‡a801.3‡x=30‡x-022
080    ‡a801.321.2
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content

Merged record before postmerge:
LDR    00000_a____
001    28475
080    ‡a801.3‡x=30‡x-022
080    ‡a801.321.2
100    ‡aTest Author
245    ‡aSome content

Expected record after postmerge:
LDR    00000_a____
001    28475
080    ‡a801.3‡x=30‡x-022
080    ‡a801.321.2
100    ‡aTest Author
245    ‡aSome content



It does not remove duplicate 65. fields
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
650  7 ‡aetymologiset sanakirjat‡xsaksan kieli‡2ysa
650  7 ‡aetymologiset sanakirjat‡2ysa

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
650  7 ‡aetymologiset sanakirjat‡xsaksan kieli‡2ysa
650  7 ‡aetymologiset sanakirjat‡2ysa

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
650  7 ‡aetymologiset sanakirjat‡xsaksan kieli‡2ysa
650  7 ‡aetymologiset sanakirjat‡2ysa



It does not consider fields with ‡9ID<KEEP>
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aTestipaikka‡9FENNI<KEEP>
260    ‡aTestipaikka, hieno

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
260    ‡aTestipaikka‡9FENNI<KEEP>
260    ‡aTestipaikka, hieno



It does not consider indicators for author fields
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
700 1  ‡aTest

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
700 2  ‡aTest author

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
700 1  ‡aTest
700 2  ‡aTest author

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
700 2  ‡aTest author



It selects the longer field
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
700 2  ‡aTest author

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
700 1  ‡aTest‡ekirjoittaja

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
700 2  ‡aTest author
700 1  ‡aTest‡ekirjoittaja

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
700 1  ‡aTest‡ekirjoittaja