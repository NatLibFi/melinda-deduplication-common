Candidate is valid if the records have same size
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
300    ‡a138 s.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
300    ‡a138 s.

Expected to be valid: true



Candidate is valid if the records have same size, even if the size information is complex
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
300    ‡a(2) s., s. 431, (5) s. 

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
300    ‡a431 s.

Expected to be valid: true



Candidate is invalid if the records have large difference in sizes
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
300    ‡a407 s.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
300    ‡a207-407 s.

Expected to be valid: false
Expected failure message: Records have different numbers of pages: 407 vs 200



Candidate is valid if the records have minor difference in sizes
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content
300    ‡a199 s.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content
300    ‡a207-407 s.

Expected to be valid: true



Candidate is valid if the records do not have page info
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

Expected to be valid: true
