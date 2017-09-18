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



All post merge modifications 
Preferred record:
LDR    00000_a____
001    28474
041    ‡aFI
100    ‡aTest Author
245    ‡aSome content
LOW    ‡aTEST-A

Other record:
LDR    00000_a____
001    28475
008    _______2016___
100    ‡aTest Author
245    ‡aSome content
250    ‡a7. ed
LOW    ‡aTEST-B
SID    ‡btest-b‡c123

Merged record before postmerge:
LDR    00000_a____
001    000000000
035    ‡z(FI-MELINDA)28474
035    ‡z(FI-MELINDA)28475
041    ‡aFI
100    ‡aTest Author
245    ‡aSome content
LOW    ‡aTEST-A
LOW    ‡aTEST-B
SID    ‡cFCC28474‡btest-a
SID    ‡btest-b‡c123

Expected record after postmerge:
LDR    00000_a____
001    000000000
035    ‡z(FI-MELINDA)28474
035    ‡z(FI-MELINDA)28475
041    ‡aFI
100    ‡aTest Author
245    ‡aSome content
LOW    ‡aTEST-A
LOW    ‡aTEST-B
SID    ‡cFCC28474‡btest-a
SID    ‡btest-b‡c123

