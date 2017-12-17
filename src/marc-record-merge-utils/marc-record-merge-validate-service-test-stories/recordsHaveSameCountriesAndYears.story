Candidate is valid if years and countries match
Preferred record:
LDR    00000_a____
001    28474
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Expected to be valid: true



Candidate is valid if years match and either has xx^ as country
Preferred record:
LDR    00000_a____
001    28474
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
008    010608s2000^^^^xx^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Expected to be valid: true



Candidate is invalid if years and countries do not match
Preferred record:
LDR    00000_a____
001    28474
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
008    010608s2000^^^^se^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Expected to be valid: false
Expected failure message: Records have different years+countries: 2000-fi^ vs 2000-se^



Candidate is invalid if years and countries do not match
Preferred record:
LDR    00000_a____
001    28474
008    010608s2001^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
008    010608s2000^^^^fi^ppz||||||||||||||mul||
100    ‡aTest Author
245    ‡aSome content

Expected to be valid: false
Expected failure message: Records have different years+countries: 2001-fi^ vs 2000-fi^
