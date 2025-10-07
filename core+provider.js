{
  "_id": "M123456789",                   // stable enterprise member id
  "mbr_change_status": "active",         // enum
  "program_year": 2025,
  "sex": "F",                            // enum: M/F/U
  "member_dob": { "$date": "1951-03-17T00:00:00Z" },
  "market_segment": "MA",
  "lob": "HMO",
  "is_deceased": false,
  "mcare_elig_date": { "$date": "2016-01-01T00:00:00Z" },
  "care_priority": "high",
  "member_identifiers": {
    "mbrid": "999000111",
    "mcid": "12345",
    "hic": "HIC123",
    "client_subscriber_id": "ABC123"
  },
  "name": { "member_first_name": "Pat", "member_last_name": "Garcia", "member_mi": "L" },
  "address": {
    "phone": "555-867-5309",
    "member_address_line_1": "12 Main St",
    "city": "Tampa",
    "state": "FL",
    "zip": "33601"
  },
  "client": { "client_id": "HUM", "client_name": "Humana", "sub_cli_sk": 171 },
  "assigned_provider": {
    "provider_id": "p1",
    "provider_state": "FL",
    "snapshot": {                    // denormalized subset for fast reads
      "providerName": "Dr Jane Roe",
      "npi": "1112223333",
      "providerCity": "Tampa",
      "providerState": "FL"
    },
    "as_of": { "$date": "2025-10-06T12:00:00Z" }
  },
  "rendered_provider": { "provider_id": "p2", "provider_state": "FL" },
  "preferred_provider": { "provider_id": "p3", "provider_state": "FL" },
  "engagement_tier": {
    "eng_tier": "Gold",
    "eng_tier_start": { "$date": "2025-01-01T00:00:00Z" },
    "eng_tier_end": { "$date": "2025-12-31T23:59:59Z" }
  },
  "measures": [
    { "program": "HEDIS", "codes": ["COL", "BCS"] }
  ],
  "payment": {
    "max_eligible_pmt": { "$numberDecimal": "1200.00" },
    "return_perct": { "$numberDecimal": "0.85" }
  },
  "annual_visits": {
    "annual_exam_complete": true,
    "annual_last_visit": { "$date": "2025-08-03T00:00:00Z" }
  },
  "created_at": { "$date": "2025-07-01T12:00:00Z" },
  "updated_at": { "$date": "2025-10-06T12:00:00Z" }
}
