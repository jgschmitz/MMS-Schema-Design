[MongoDB_Schema_Guidelines_User.md](https://github.com/user-attachments/files/22748181/MongoDB_Schema_Guidelines_User.md)
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
```

## 2) Reference + snapshot for providers (hybrid)

Keep a canonical provider_details collection, and in member embed a small, read-optimized snapshot of the provider fields you actually show in the UI (e.g., name, npi, city/state) under assigned_provider, rendered_provider, and preferred_provider. Always store the provider_id for joins.

Benefits

Fast reads for common screens (no extra lookup)

Correctness by keeping the canonical provider record in one place

Member snippet

```json
{
  "_id": "M123456789",
  "assigned_provider": {
    "provider_id": "p1",
    "provider_state": "FL",
    "snapshot": {
      "providerName": "Dr Jane Roe",
      "npi": "1112223333",
      "providerCity": "Tampa",
      "providerState": "FL"
    },
    "as_of": { "$date": "2025-10-06T12:00:00Z" }
  }
}
```

Canonical provider_details

```json
{
  "_id": "p1",                       // consider provider_id or npi if unique
  "identifiers": { "npi": "1112223333", "taxId": "12-3456789" },
  "name": { "first": "Jane", "last": "Roe", "full": "Dr Jane Roe" },
  "type": "PCP",
  "contact": { "phone": "555-123-4567", "address": { "city": "Tampa", "state": "FL" } },
  "specialties": [{ "code": "207Q00000X", "desc": "Family Medicine" }],
  "status": { "active": true, "cms_preclusion": false },
  "created_at": { "$date": "2024-05-01T00:00:00Z" },
  "updated_at": { "$date": "2025-09-20T00:00:00Z" }
}
```

## 3) Tame unbounded arrays

The arrays incentivePrograms, deployments, member_submissions, and specialistDetails can grow without bound. Move events/growing lists to their own collections:

member_programs — one doc per member + program + year

member_program_deployments — event records

member_submissions — event records

member_specialists — one per member + provider

Keep arrays bounded inside member (e.g., cache only the last 3 specialists if needed for the UI).

Examples

```json
// member_programs
{
  "_id": "M123-HEDIS-2025",
  "member_id": "M123",
  "program": "HEDIS",
  "year": 2025,
  "measures": ["COL", "BCS"],
  "status": "active",
  "created_at": { "$date": "2025-01-01T00:00:00Z" },
  "updated_at": { "$date": "2025-10-01T00:00:00Z" }
}
```

```json
// member_program_deployments (events)
{
  "_id": { "$oid": "..." },
  "member_id": "M123",
  "program": "HEDIS",
  "channel_name": "mail",
  "deployed": true,
  "ts": { "$date": "2025-09-01T12:00:00Z" }
}
```

```json
// member_specialists (relationship)
{
  "_id": "M123-p9",
  "member_id": "M123",
  "provider_id": "p9",
  "is_active": true,
  "cms_preclusion": false,
  "specialties": [{ "code": "207N00000X", "desc": "Dermatology" }],
  "association_status": "active",
  "association_status_ts": { "$date": "2025-07-15T10:30:00Z" }
}
```

## 4) Names, IDs, and keys

Make _id meaningful when you have a real-world key. For provider_details, consider _id = provider_id or npi (if guaranteed unique).

Keep member._id stable (enterprise “member_id”).

Use consistent case: prefer snake_case (you are mostly there).

## 5) Index plan (practical)

members

```javascript
// Unique where present
db.members.createIndex(
  { "member_identifiers.mbrid": 1 },
  { unique: true, partialFilterExpression: { "member_identifiers.mbrid": { $exists: true } } }
);

// Name + DOB search (case-insensitive collation)
db.members.createIndex(
  { "name.member_last_name": 1, "name.member_first_name": 1, "member_dob": 1 },
  { collation: { locale: "en", strength: 2 } }
);

// Provider links
db.members.createIndex({ "assigned_provider.provider_id": 1 });
db.members.createIndex({ "preferred_provider.provider_id": 1 });
db.members.createIndex({ "rendered_provider.provider_id": 1 });

// Common filters
db.members.createIndex({ "client.client_id": 1, "address.state": 1 });

// If you keep specialistDetails embedded:
db.members.createIndex({ "specialistDetails.providerId": 1 });
```

provider_details

```javascript
db.provider_details.createIndex({ "identifiers.npi": 1 }, { unique: true });
db.provider_details.createIndex({ "identifiers.taxId": 1 });
db.provider_details.createIndex({ "contact.address.state": 1 });
```

## 6) Shard (if/when you need it)

For large, multi-tenant workloads:

Option A (general): shard members on a hashed _id (good fan-out)

Option B (tenant-aware): shard on { "client.client_id": 1, "_id": "hashed" } if most queries are tenant-scoped

```javascript
sh.enableSharding("care");
sh.shardCollection("care.members", { _id: "hashed" });
// or:
sh.shardCollection("care.members", { "client.client_id": 1, "_id": "hashed" });
```

Keep provider→member fan-out balanced.

## 7) Validation & governance

Add a JSON Schema validator with enums for small domains (sex, eng_tier, assignment_type, tier, etc.), and correct types for PII dates/booleans.

```javascript
db.createCollection("members", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "name", "member_dob", "client", "created_at", "updated_at"],
      properties: {
        _id: { bsonType: "string" },
        sex: { enum: ["M", "F", "U", null] },
        member_dob: { bsonType: "date" },
        is_deceased: { bsonType: "bool" },
        program_year: { bsonType: ["int", "null"] },
        payment: {
          bsonType: "object",
          properties: {
            max_eligible_pmt: { bsonType: "decimal" },
            return_perct: { bsonType: "decimal" }
          }
        },
        assigned_provider: {
          bsonType: "object",
          properties: {
            provider_id: { bsonType: "string" },
            provider_state: { bsonType: "string" },
            as_of: { bsonType: "date" }
          }
        }
      }
    }
  }
});
```

Auditing fields as real Dates

```javascript
db.members.updateMany({}, {
  $setOnInsert: { created_at: new Date() },
  $currentDate: { updated_at: true }
});
```

Queryable Encryption (FLE2) candidates
Encrypt identifiers you must equality-filter on but need to keep confidential, e.g. member_identifiers.hic, member_identifiers.mbrid, member_identifiers.ucard.

## 8) Money & percentages as decimals

The payment object contains amounts/percentages — store them as NumberDecimal so calculations are exact and sorting works.

```json
"payment": {
  "max_eligible_pmt": { "$numberDecimal": "1200.00" },
  "return_perct": { "$numberDecimal": "0.85" }
}
```

## 9) Atlas Search (optional but powerful)

Create a Search index on member name/identifiers/address and another on provider name/specialty. This replaces many regex/collation scans and speeds up user lookup dramatically.

Members search index (example)

```javascript
db.runCommand({
  createSearchIndexes: "members",
  indexes: [{
    name: "member_search",
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          "name.member_first_name": { "type": "string" },
          "name.member_last_name":  { "type": "string" },
          "member_identifiers.mbrid": { "type": "string" },
          "address.city": { "type": "string" },
          "address.state": { "type": "string" },
          "address.zip": { "type": "string" }
        }
      }
    }
  }]
});
```

Providers search index (example)

```javascript
db.runCommand({
  createSearchIndexes: "provider_details",
  indexes: [{
    name: "provider_search",
    definition: {
      mappings: {
        dynamic: false,
        fields: {
          "name.full": { "type": "string" },
          "identifiers.npi": { "type": "string" },
          "specialties.desc": { "type": "string" },
          "contact.address.city": { "type": "string" },
          "contact.address.state": { "type": "string" }
        }
      }
    }
  }]
});
```

Summary Checklist

- Convert strings → proper types (Date, Decimal128, Boolean, Int)
- Use hybrid modeling: provider reference + small snapshot in member
- Move unbounded arrays to separate collections; keep bounded caches in member
- Normalize IDs/names and keep _id meaningful & stable
- Create practical indexes (see scripts)
- Plan sharding if multi-tenant or very large
- Add JSON Schema validator, audit dates, and consider FLE
- Add Atlas Search for fast user/provider lookups

These patterns keep member documents small, hot, and queryable while preserving a clean source of truth for providers and histories.
