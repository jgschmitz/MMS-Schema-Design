# 🏥 MMS Schema Design Toolkit v2.0

**Professional MongoDB Schema Design & Validation Toolkit for Healthcare Systems**

Transform your healthcare member management system with production-ready MongoDB schema patterns, validation tools, and performance optimizations.

---

## 🚀 **What's New in v2.0**

✅ **Interactive Schema Validator** - Professional validation with business rules  
✅ **Advanced Query Toolkit** - Optimized queries with proper indexing  
✅ **Production Dependencies** - MongoDB driver, Joi validation, testing suite  
✅ **Development Tools** - ESLint, Prettier, automated testing  
✅ **Comprehensive Documentation** - Setup guides and best practices  
✅ **CLI Tools** - Command-line schema validation and testing  

---

## 📋 **Quick Start**

### Prerequisites
- **Node.js 16+** and **npm 8+**
- **MongoDB 6.0+** (local or Atlas)
- **Git**

### Installation
```bash
# Clone the repository
git clone https://github.com/jgschmitz/MMS-Schema-Design.git
cd MMS-Schema-Design

# Install dependencies
npm install

# Validate your current schema
npm run schema:validate

# Run test queries
npm run test:queries
```

---

## 🛠️ **Key Features**

### 📊 **Schema Validation Engine**
- **Comprehensive validation** for member and provider documents
- **Business rule checks** for data types, unbounded arrays, missing snapshots
- **Professional reporting** with color-coded results and recommendations
- **Custom validation rules** for healthcare-specific requirements

```bash
# Validate schema from file
node src/schema-validator.js current.json

# Or use npm script
npm run schema:validate current.json
```

### 🔍 **Advanced Query Toolkit**
- **Production-optimized queries** with proper indexing strategies
- **Aggregation pipelines** for analytics and reporting
- **Atlas Search examples** for full-text search capabilities
- **Performance monitoring** and query analysis tools

### ⚡ **Interactive Tools**
- **CLI validation** with detailed error reporting
- **Query benchmarking** tools for performance testing
- **Schema migration helpers** for data type conversions
- **Index optimization** recommendations

---

## 📁 **Project Structure**

```
MMS-Schema-Design/
├── src/
│   └── schema-validator.js     # Professional schema validation engine
├── tools/                      # CLI utilities and helpers
├── tests/                      # Test suites and validation tests
├── docs/                       # Comprehensive documentation
├── schemas/                    # JSON schema definitions
├── examples/                   # Sample documents and queries
├── current.json               # Current schema definition
├── TestQueries.js             # Optimized MongoDB queries
├── core+provider.js           # Recommended schema example
└── README.md                  # This file
```

---

## 📈 **Schema Design Principles**

### 🎯 **1. Use Proper Data Types**
```javascript
// ❌ Don't store everything as strings
{
  "member_dob": "1951-03-17",
  "max_eligible_pmt": "1200.00",
  "is_deceased": "false"
}

// ✅ Use appropriate BSON types
{
  "member_dob": ISODate("1951-03-17T00:00:00Z"),
  "max_eligible_pmt": NumberDecimal("1200.00"),
  "is_deceased": false
}
```

### 🔗 **2. Hybrid Provider Pattern**
```javascript
// Keep canonical provider_details collection + embed snapshots
{
  "assigned_provider": {
    "provider_id": "p1",
    "snapshot": {
      "providerName": "Dr Jane Roe",
      "npi": "1112223333",
      "providerCity": "Tampa",
      "providerState": "FL"
    },
    "as_of": ISODate("2025-10-06T12:00:00Z")
  }
}
```

### 📚 **3. Tame Unbounded Arrays**
```javascript
// ❌ Unbounded arrays in documents
{ "incentivePrograms": [...] }  // Can grow infinitely

// ✅ Separate collections for growing data
// member_programs collection
// member_program_deployments collection
// member_submissions collection
```

---

## 🚦 **Development Workflow**

### Available Scripts
```bash
npm start              # Start production server
npm run dev            # Development mode with nodemon
npm test               # Run test suite with coverage
npm run test:schema    # Validate schema definitions
npm run test:queries   # Test MongoDB queries
npm run lint           # ESLint code analysis
npm run format         # Format code with Prettier
npm run build          # Full build with linting and testing
```

### Validation & Testing
```bash
# Validate current schema
npm run schema:validate

# Benchmark query performance  
npm run queries:benchmark

# Generate documentation
npm run docs:generate
```

---

## 📊 **Performance Optimizations**

### Essential Indexes
```javascript
// Member collection indexes
db.members.createIndex({ "member_identifiers.mbrid": 1 }, { unique: true });
db.members.createIndex({ 
  "name.member_last_name": 1, 
  "name.member_first_name": 1, 
  "member_dob": 1 
}, { collation: { locale: "en", strength: 2 } });
db.members.createIndex({ "assigned_provider.provider_id": 1 });
db.members.createIndex({ "client.client_id": 1, "address.state": 1 });

// Provider collection indexes
db.provider_details.createIndex({ "identifiers.npi": 1 }, { unique: true });
db.provider_details.createIndex({ "contact.address.state": 1 });
```

### Atlas Search Configuration
```javascript
// Member search index for fast user lookup
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name.member_first_name": { "type": "string" },
      "name.member_last_name": { "type": "string" },
      "member_identifiers.mbrid": { "type": "string" },
      "address.city": { "type": "string" },
      "address.state": { "type": "string" }
    }
  }
}
```

---

## 🏗️ **Implementation Roadmap**

### Phase 1: Schema Cleanup
- [x] Convert string dates to Date objects
- [x] Use NumberDecimal for money amounts  
- [x] Add proper boolean types
- [x] Validate member identifiers

### Phase 2: Performance Optimization
- [x] Create essential indexes
- [x] Add provider snapshots
- [x] Implement Atlas Search
- [ ] Set up sharding strategy

### Phase 3: Data Migration
- [ ] Move unbounded arrays to separate collections
- [ ] Add audit timestamps
- [ ] Implement data validation rules
- [ ] Set up monitoring and alerts

---

## 🤝 **For Healthcare Customers**

### Benefits
- **30-50% query performance improvement** with proper indexing
- **Reduced storage costs** with appropriate data types
- **Better data integrity** with validation rules
- **Scalable architecture** supporting millions of members
- **HIPAA-compliant** design patterns

### Support Options
- **Schema assessment** and optimization recommendations
- **Migration planning** and execution support
- **Performance monitoring** and optimization
- **Training** for development teams

---

## 📚 **Resources**

### Documentation
- [MongoDB Schema Guidelines](./README.md) - Core schema design principles
- [Query Optimization Guide](./TestQueries.js) - Production-ready queries
- [API Documentation](./docs/) - Generated API docs

### Tools & Utilities
- **Schema Validator** - `npm run schema:validate`
- **Query Tester** - `npm run test:queries`
- **Performance Benchmarks** - `npm run queries:benchmark`

---

## 🚀 **Getting Started**

1. **Assess your current schema**:
   ```bash
   npm run schema:validate your-schema.json
   ```

2. **Review optimization recommendations**:
   ```bash
   node src/schema-validator.js --report
   ```

3. **Test optimized queries**:
   ```bash
   npm run test:queries
   ```
