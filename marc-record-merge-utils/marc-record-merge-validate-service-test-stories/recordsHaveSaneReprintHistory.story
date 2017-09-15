Candidate is valid if neither record has reprint info
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



Candidate is valid if older record has reprint info
Preferred record:
LDR    00000_a____
001    28474
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
008    010608s2002^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content
250    ‡a2. painos

Expected to be valid: true




Candidate is valid if both records have reprint info
Preferred record:
LDR    00000_a____
001    28474
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content
250    ‡a2. painos

Other record:
LDR    00000_a____
001    28475
008    010608s2002^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content
250    ‡a3. painos

Expected to be valid: true



Candidate is invalid if younger record has reprint info
Preferred record:
LDR    00000_a____
001    28474
008    010608s2002^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content
250    ‡a2. painos


Expected to be valid: false
Expected failure message: Younger record has reprint information
