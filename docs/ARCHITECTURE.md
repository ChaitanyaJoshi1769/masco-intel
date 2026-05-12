# Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Content    │  │    Popup     │  │ Background   │      │
│  │    Script    │  │     UI       │  │   Worker     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API Calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (NestJS)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Product    │  │   Pricing    │  │    Quality   │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Matching   │  │  Contractor  │                        │
│  │  Controller  │  │  Controller  │                        │
│  └──────────────┘  └──────────────┘                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            Databases & Cache                               │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │   PostgreSQL     │  │     Redis        │               │
│  │  - Products      │  │   - Cache        │               │
│  │  - Prices        │  │   - Sessions     │               │
│  │  - Quality Data  │  │                  │               │
│  │  - Compatibility │  │                  │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Product Detection Flow

```
User visits product page
         ↓
Content Script extracts:
  - Title, SKU, MPN, UPC
  - Price, Image
  - Specifications
  - URL
         ↓
Extension injects badge
         ↓
User clicks badge
         ↓
Popup queries API endpoints:
  - /api/products/sku/{sku}
  - /api/products/{id}/alternatives
  - /api/quality/{id}/grade-detection
         ↓
Popup displays results
```

### 2. Price Tracking Flow

```
Scraper discovers product
         ↓
Extracts SKU, price, URL
         ↓
Matches against existing products
         ↓
Creates PriceHistory record
         ↓
Updates price trends
         ↓
API aggregates across retailers
         ↓
Shows comparison to user
```

### 3. Quality Analysis Flow

```
Product added to database
         ↓
AI analyzes:
  - Description
  - Specifications
  - Material composition
  - Warranty terms
         ↓
Detects builder-grade signals:
  - Price point
  - Plastic components
  - Limited warranty
  - Collection name
         ↓
Stores QualityAnalysis
         ↓
Contractor feedback refines scores
         ↓
API returns detection results
```

## Service Architecture

### Product Service
**Responsibilities:**
- CRUD operations for products
- SKU/MPN/UPC lookups
- Full-text search
- Brand management

### Pricing Service
**Responsibilities:**
- Track historical prices
- Calculate average prices across retailers
- Estimate markup percentages
- Identify price anomalies

### Matching Service
**Responsibilities:**
- Deduplicate products across retailers
- Find compatible parts (cartridges, valves)
- Semantic product matching
- Handle SKU normalization

### Quality Service
**Responsibilities:**
- Analyze product descriptions for quality signals
- Detect builder-grade vs premium products
- Score repairability and longevity
- Manage quality assessment data

### Contractor Service
**Responsibilities:**
- Track contractor feedback
- Calculate failure rates
- Estimate repair costs
- Recommend products for professional use
- Compare brands by reliability

## Database Design

### Core Tables

**Product**
```sql
- id (PK)
- sku (unique with brand)
- mpn, upc
- title, description
- brand_id (FK)
- collection, product_type, finish
- valve_type, specifications (JSON)
- certifications, estimated_grade
- image_url, image_hash
- created_at, updated_at
```

**PriceHistory**
```sql
- id (PK)
- product_id (FK)
- retailer_id (FK)
- price
- url, in_stock
- timestamp (indexed)
```

**QualityAnalysis**
```sql
- id (PK)
- product_id (FK, unique)
- quality_score, serviceability_score
- contractor_score, longevity_score
- repairability_score
- has_plastic_components
- warranty_years
- repair_parts_available
- estimated_lifespan, common_failures
- updated_at
```

**ContractorIntelligence**
```sql
- id (PK)
- product_id (FK, unique)
- failure_rate, repair_cost
- install_difficulty, longevity
- common_issues (array)
- install_time_minutes
- recommended_alternative
- updated_at
```

**CompatibilityMapping**
```sql
- id (PK)
- source_product_id (FK)
- target_product_id (FK)
- relationship (enum: replacement-cartridge, valve, trim, interchangeable)
- confidence_score
- created_at
```

### Indexes

```sql
-- Performance critical indexes
CREATE INDEX idx_product_sku ON products(sku);
CREATE INDEX idx_product_mpn ON products(mpn);
CREATE INDEX idx_product_brand ON products(brand_id);
CREATE INDEX idx_price_product_date ON price_history(product_id, timestamp DESC);
CREATE INDEX idx_price_retailer ON price_history(retailer_id);
CREATE INDEX idx_compatibility_source ON compatibility_mapping(source_product_id);
CREATE INDEX idx_compatibility_type ON compatibility_mapping(relationship);

-- Full-text search
CREATE INDEX idx_product_fulltext ON products USING GIN(to_tsvector('english', title || ' ' || description));
```

## Extension Architecture

### Content Script (`content.ts`)
- Runs in page context
- Extracts DOM data
- Injects UI elements
- Communicates with popup via message passing
- Retailer-specific extractors

### Popup (`popup.tsx`)
- React component tree
- Fetches API data
- Displays comparisons
- Zustand state management
- Styling with Tailwind CSS

### Background Worker (`background.ts`)
- Handles lifecycle events
- Optional: Pre-fetching, analytics
- CORS proxy (future)

### Message Protocol

```typescript
// Content → Popup/Background
chrome.runtime.sendMessage({
  type: 'EXTRACT_PRODUCT',
  payload: { /* data */ }
});

// Popup → API
fetch('/api/products/alternatives?sku=ABC123')
```

## Scaling Considerations

### Database

- **Partitioning**: PriceHistory by date range
- **Replication**: Read replicas for reporting
- **Caching**: Redis for frequent queries
- **Search**: Elasticsearch for full-text if scale > 1M products

### API

- **Rate Limiting**: Per extension ID or API key
- **Caching**: CloudFlare or Redis
- **CDN**: Static content, extension files
- **Horizontal Scaling**: Load balancer with multiple API instances

### Extension

- **Background**: Service worker pooling for CPU-intensive tasks
- **Compression**: Minified builds, chunking
- **Lazy Loading**: On-demand script loading

## Security

### API Security
- JWT authentication
- CORS restrictions
- Rate limiting
- Input validation
- SQL injection prevention (Prisma)
- XSS protection (React)

### Extension Security
- Minimal permissions (activeTab, storage only)
- Content Security Policy
- No credential storage
- Message validation
- URL pattern restrictions

### Data Privacy
- No user tracking
- No data sharing
- Database encryption at rest (recommended)
- HTTPS only
- GDPR compliance ready

## Future Improvements

1. **Vector Search**: Semantic product matching with embeddings
2. **ML Models**: Failure prediction, price forecasting
3. **Event Streaming**: Real-time price updates via WebSocket
4. **Distributed Caching**: Memcached for multi-region deployment
5. **Scraping Framework**: Resilient, distributed scraper network
6. **Image Recognition**: Visual product identification
