Candidate is valid if the records have no notes in 583
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



Candidate is valid if the records have notes in 583 that do not contain word SPLIT
Preferred record:
LDR    00000_a____
001    28474
008    110824s2001^^^^xx^|||||||||||||||||eng|c
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2001.
583    ‡aAUTOMATICALLY MERGED FROM A + B

Other record:
LDR    00000_a____
001    28475
008    020131s2001^^^^xxu|||||||||||||||||eng||
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2001.
583    ‡aMERGED FROM C + D

Expected to be valid: true



Candidate is invalid if either of the records has a note containing word SPLIT
Preferred record:
LDR    00001_a____
001    28474
008    110824s2002^^^^xx^|||||||||||||||||eng|c
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
583    ‡aSPLIT FROM A

Other record:
LDR    00002_a____
001    28475
008    020131s2001^^^^xxu|||||||||||||||||eng||
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.

Expected to be valid: false
Expected failure message: Records have been splitted



Candidate is invalid if both records has a note containing word SPLIT
Preferred record:
LDR    00001_a____
001    28474
008    110824s^^^^^^^^xx^|||||||||||||||||eng|c
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2001.
583    ‡aSPLIT FROM A

Other record:
LDR    00002_a____
001    28475
008    020131s^^^^^^^^xxu|||||||||||||||||eng||
100 1  ‡aChomsky, Noam.
245 10 ‡a9-11 /‡cNoam Chomsky.
260    ‡aNew York :‡bSeven Stories Press,‡ccop. 2002.
583    ‡aSPLIT FROM B

Expected to be valid: false
Expected failure message: Records have been splitted
