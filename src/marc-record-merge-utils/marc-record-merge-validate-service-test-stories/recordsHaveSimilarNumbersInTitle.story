Candidate is valid if the records have same 245a
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245 10 ‡aSymphonies 1 & 5 /‡cJean Sibelius.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245 10 ‡aSymphonies 1 & 5 /‡cJean Sibelius.

Expected to be valid: true



Candidate is invalid if the records have differing numbers in 245a
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245 10 ‡aSymphonies 1 & 5 /‡cJean Sibelius.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245 10 ‡aSymphonies 1-7 /‡cSibelius.

Expected to be valid: false
Expected failure message: Records have different numbers in title: 1,5 vs 1,7



Candidate is valid if the records do not have any numbers in 245a
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245 10 ‡aSymphonies‡cJean Sibelius.

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245 10 ‡aSymphonies‡cSibelius.

Expected to be valid: true

