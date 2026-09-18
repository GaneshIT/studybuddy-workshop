export const SAMPLE_NOTES = `DBMS Unit 3: Normalization

Normalization is the process of organizing data in a relational database to reduce redundancy (repeated data) and avoid anomalies.

Why normalize?
- Insertion anomaly: we cannot add some data without adding other, unrelated data. Example: we cannot add a new course until a student enrolls in it.
- Update anomaly: the same fact is stored in many rows, so updating one row and forgetting others makes the data inconsistent.
- Deletion anomaly: deleting one fact accidentally deletes another. Example: deleting the last student of a course also deletes the course details.

Functional dependency (FD): A -> B means the value of A decides the value of B. Example: RollNo -> StudentName.

First Normal Form (1NF): every column holds atomic (single) values and there are no repeating groups. A "Phone" column with "98400, 98401" breaks 1NF.

Second Normal Form (2NF): the table is in 1NF and every non-key column depends on the whole primary key, not just part of it (no partial dependency). This matters only when the primary key is composite, like (RollNo, CourseID).

Third Normal Form (3NF): the table is in 2NF and no non-key column depends on another non-key column (no transitive dependency). Example: RollNo -> DeptID -> DeptName breaks 3NF, so move DeptName to a separate Department table.

BCNF (Boyce-Codd Normal Form): a stricter 3NF. For every functional dependency A -> B, A must be a super key.

Trade-off: higher normal forms mean less redundancy but more tables and more JOINs, which can slow down read-heavy queries. Sometimes designers denormalize on purpose for speed.`;
