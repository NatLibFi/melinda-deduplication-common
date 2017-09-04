Candidate is valid if the records have the same author
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



Candidate is invalid if the records have differing authors
Preferred record:
LDR    00000_a____
001    28475
100    ‡aJohn Doe
245    ‡aSome content

Other record:
LDR    00000_b____
001    28475
100    ‡aTest Author
245    ‡aSome content

Expected to be valid: false
Expected failure message: Records have different authors



Candidate is invalid if the records have authors in different fields
Preferred record:
LDR    00000_a____
001    28475
100    ‡aJohn Doe
245    ‡aSome content

Other record:
LDR    00000_b____
001    28475
245    ‡aSome content
700    ‡aJohn Doe

Expected to be valid: false
Expected failure message: Records have different authors



Candidate is valid if the records have authors that are only slightly different
Preferred record:
LDR    00000_a____
001    28475
100    ‡aJohn Doe
245    ‡aSome content

Other record:
LDR    00000_b____
001    28475
100    ‡aJohnny Doe
245    ‡aSome content

Expected to be valid: true




Candidate is valid if the records have authors in 700 fields
Preferred record:
LDR    00000_a____
001    28475
245    ‡aSome content
700    ‡aJohn Doe

Other record:
LDR    00000_b____
001    28475
245    ‡aSome content
700    ‡aJohn Doe

Expected to be valid: true
