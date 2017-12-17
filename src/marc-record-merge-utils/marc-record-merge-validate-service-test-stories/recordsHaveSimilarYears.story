Candidate is valid if the records have no year information
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



Candidate is valid if the records have same years
Preferred record:
LDR    00000_a____
001    28474
008    110824s2001^^^^xx^|||||||||||||||||eng|c
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2001.

Other record:
LDR    00000_a____
001    28475
008    020131s2001^^^^xxu|||||||||||||||||eng||
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2001.

Expected to be valid: true



Candidate is invalid if the records have differing years in 008
Preferred record:
LDR    00001_a____
001    28474
008    110824s2002^^^^xx^|||||||||||||||||eng|c
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.

Other record:
LDR    00002_a____
001    28475
008    020131s2001^^^^xxu|||||||||||||||||eng||
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.

Expected to be valid: false
Expected failure message: Records have differing years: 2002 vs 2001



Candidate is invalid if the records have differing years in 260c
Preferred record:
LDR    00001_a____
001    28474
008    110824s^^^^^^^^xx^|||||||||||||||||eng|c
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2001.

Other record:
LDR    00002_a____
001    28475
008    020131s^^^^^^^^xxu|||||||||||||||||eng||
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2002.

Expected to be valid: false
Expected failure message: Records have differing years: 2001 vs 2002
