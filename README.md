# MongoDB Schema Guidelines — member & provider_details

This document captures recommended improvements to your MongoDB schema for performance, correctness, and maintainability. It focuses only on MongoDB modeling (no external systems).

## 1) Use the right types (not all strings)

Rule of thumb

Dates → Date

Money/percentages → NumberDecimal (Decimal128)

Counts/years → NumberInt / NumberLong

True/false → Boolean

Why: Better range queries, sorts, aggregations, and storage efficiency.

Example

```json
{
  "_id": "M123456789",
  "program_year": 2025,
  "member_dob": { "$date": "1951-03-17T00:00:00Z" },
  "is_deceased": false,
  "payment": {
    "max_eligible_pmt": { "$numberDecimal": "1200.00" },
    "return_perct": { "$numberDecimal": "0.85" }
  }
}
