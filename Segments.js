// 1. Create the gated view for MA segment
db.createView(
  "restricted_MA_view", 
  "source_data", 
  [{ $match: { market_segment: "MA" } }]
);


// 2. Create the gated view for ACA segment
db.createView(
  "restricted_ACA_view", 
  "source_data", 
  [{ $match: { market_segment: "ACA" } }]
);


// 3. Create the gated view for MD segment
db.createView(
  "restricted_MD_view",
  "source_data",
  [{ $match: { market_segment: "MD" } }]
);
