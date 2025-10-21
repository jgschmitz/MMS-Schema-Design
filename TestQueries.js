// 1) Basic filters
db.COLLECTION.find(
  { "TOP.FIELD": VALUE, "DATE.FIELD": { $gte: ISODate("2025-01-01") } },
  { _id: 0, "FIELDS.YOU.NEED": 1 }
).limit(50);

// 2) Unique values
db.COLLECTION.distinct("PATH.TO.FIELD");

// 3) Search inside array of objects
db.COLLECTION.aggregate([
  { $unwind: "$ARRAY.FIELD" },
  { $match: { "ARRAY.FIELD.SUB": VALUE } },
  { $project: { _id: 0, ROOT_ID: "$_id", item: "$ARRAY.FIELD" } }
]);

// 4) Group & count
db.COLLECTION.aggregate([
  { $group: { _id: "$GROUP.FIELD", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 20 }
]);

// 5) Text search (if text index exists)
db.COLLECTION.find({ $text: { $search: "your keywords" } },
  { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });

// 6) Vector search (Atlas)
db.COLLECTION.aggregate([
  {
    $vectorSearch: {
      index: "VECTOR_INDEX_NAME",
      path: "EMBEDDING.FIELD",
      queryVector: YOUR_QUERY_VECTOR,   // array of floats
      numCandidates: 200,
      limit: 10
    }
  },
  { $project: { _id: 0, doc: "$$ROOT", score: { $meta: "vectorSearchScore" } } }
]);

// 7) Faceted summary
db.COLLECTION.aggregate([
  { $match: {/* your filters */} },
  {
    $group: {
      _id: {
        A: "$FIELD.A",
        B: "$FIELD.B"
      },
      total: { $sum: 1 }
    }
  },
  { $sort: { total: -1 } }
]);

// 8) Denormalized lookup (if you have separate collections)
db.COLLECTION.aggregate([
  { $lookup: {
      from: "OTHER_COLLECTION",
      localField: "LOCAL.KEY",
      foreignField: "FOREIGN.KEY",
      as: "joined"
  }},
  { $unwind: { path: "$joined", preserveNullAndEmptyArrays: true } },
  { $project: { _id: 0, /* fields */ } }
]);
