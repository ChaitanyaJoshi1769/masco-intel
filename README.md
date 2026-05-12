# 🔧 Masco Intel

**Bloomberg Terminal for Plumbing & Home Improvement Products**

Masco Intel is an open-source platform for real-time pricing intelligence, quality analysis, and contractor recommendations for plumbing fixtures, faucets, and home improvement products.

## 🎯 What It Does

Visit Home Depot, Lowe's, Amazon, or any supported retailer. The Masco Intel Chrome extension automatically:

- 📊 **Extracts** product SKU, MPN, UPC, specifications
- 💰 **Compares** prices across 8+ retailers in real-time
- 🏗️ **Detects** builder-grade vs premium-grade products
- 🔧 **Analyzes** quality, repairability, and contractor recommendations
- 🔗 **Finds** compatible replacement cartridges and valves
- 📈 **Shows** historical pricing and markup analysis
- 🏢 **Identifies** OEM relationships and sourcing intelligence

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/masco-intel.git
cd masco-intel

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Start database
docker-compose -f infrastructure/docker/docker-compose.yml up

# Run migrations
cd packages/db
pnpm migrate

# Start development
pnpm dev
```

### Building the Extension

```bash
cd apps/extension
pnpm build

# Load dist/ in Chrome: chrome://extensions -> Load unpacked
```

### Starting the API

```bash
cd apps/api
pnpm dev
# API runs on http://localhost:3001
```

## 📦 Architecture

### Monorepo Structure

```
masco-intel/
├── apps/
│   ├── extension/        # Chrome extension (React + TypeScript)
│   ├── api/             # NestJS backend API
│   └── dashboard/       # (Coming soon) Analytics dashboard
├── packages/
│   ├── db/              # Prisma schemas & migrations
│   ├── shared/          # Shared TypeScript types
│   ├── scrapers/        # Retailer data scrapers
│   ├── pricing-engine/  # Price intelligence service
│   ├── matching-engine/ # Product matching & deduplication
│   ├── quality-engine/  # Quality & builder-grade detection
│   ├── ai-engine/       # AI recommendations & embeddings
│   └── contractor-engine/ # Contractor intelligence
├── infrastructure/
│   ├── docker/
│   └── k8s/
└── docs/
```

### Tech Stack

**Frontend:**
- React 18, TypeScript, Vite
- TailwindCSS, Framer Motion
- Zustand for state management
- Chrome Manifest V3

**Backend:**
- NestJS (Node.js framework)
- PostgreSQL (primary database)
- Redis (caching)
- Prisma ORM

**AI/ML:**
- OpenAI embeddings for semantic search
- Vector similarity matching
- Image embedding for product recognition

**DevOps:**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Turborepo (monorepo orchestration)

## 🎮 API Endpoints

### Products
```bash
GET  /api/products/search?q=delta%20faucet
GET  /api/products/sku/{sku}
GET  /api/products/mpn/{mpn}
GET  /api/products/{id}/alternatives
POST /api/products
```

### Pricing
```bash
GET /api/pricing/{productId}/history
GET /api/pricing/{productId}/comparison
GET /api/pricing/{productId}/markup?msrp=150
```

### Quality & Grading
```bash
GET /api/quality/{productId}
GET /api/quality/{productId}/grade-detection
GET /api/quality/compare?source={id1}&target={id2}
```

### Matching
```bash
GET /api/matching/by-identifier?sku={sku}&mpn={mpn}
GET /api/matching/by-title?title={title}&brand={brand}
GET /api/matching/compatible?productId={id}
```

### Contractor Intelligence
```bash
GET /api/contractor/{productId}/intelligence
GET /api/contractor/{productId}/recommendations
GET /api/contractor/brands/comparison?brands=Delta,Brizo,Hansgrohe
```

## 🏗️ Building the Extension

The extension architecture:

1. **Content Script** (`content.ts`)
   - Extracts product data from retailer pages
   - Injects product badges and UI elements
   - Communicates with popup via message passing

2. **Popup** (`popup.tsx`)
   - Shows product analysis and alternatives
   - Fetches data from backend API
   - Displays pricing, quality scores, recommendations

3. **Background Service Worker** (`background.ts`)
   - Handles extension lifecycle
   - Optional pre-fetching and analytics

## 🧠 Intelligence Features

### Builder-Grade Detector

Analyzes products to determine quality tier:

- **Price heuristics**: Budget vs premium pricing
- **Material analysis**: Plastic vs brass internals
- **Warranty assessment**: Limited vs comprehensive coverage
- **Brand signatures**: Luxury vs builder-grade brands
- **Collection patterns**: Basic vs premium collections

```typescript
// Returns confidence score and reasoning
GET /api/quality/{productId}/grade-detection
{
  "grade": "builder-grade",
  "confidence": 0.85,
  "reasoning": "Budget price point; plastic components detected; limited warranty"
}
```

### Contractor Recommendation Engine

Scores products for contractor use:

- **Failure rates**: Field reliability data
- **Longevity**: Expected lifespan estimates
- **Install difficulty**: Complexity scoring
- **Repair availability**: Parts accessibility
- **Cost of ownership**: Total maintenance costs

### Product Matching

Deduplicates products across retailers using:

- SKU normalization and fuzzy matching
- MPN and UPC lookup
- Title similarity (Levenshtein distance)
- Semantic embeddings for images
- Finish and collection normalization

## 📊 Database Schema

Key models:

- **Product**: Core product data (SKU, MPN, title, specs)
- **Brand**: Manufacturer information
- **PriceHistory**: Time-series pricing across retailers
- **QualityAnalysis**: Scoring and builder-grade detection
- **ContractorIntelligence**: Failure rates, longevity, install difficulty
- **CompatibilityMapping**: Cartridge, valve, and trim compatibility
- **Retailer**: Supported retailers and metadata

## 🔐 Security & Privacy

- Minimal extension permissions (activeTab, storage)
- No credential storage
- CORS-protected API endpoints
- Environment-based configuration
- No user data tracking (privacy-first)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup
- Pull request process
- Code standards
- Testing requirements
- Adding new retailers

## 📋 Roadmap

### Phase 1 (Current)
- [x] Extension foundation
- [x] Core API services
- [x] Database schema
- [x] Product matching engine
- [x] Quality detection
- [ ] Real retailer data integration
- [ ] Historical pricing database

### Phase 2
- [ ] AI-powered recommendations
- [ ] Image-based product recognition
- [ ] Barcode scanning
- [ ] Wholesale pricing intelligence
- [ ] Supply chain mapping

### Phase 3
- [ ] Dashboard analytics
- [ ] Bulk contractor ordering tools
- [ ] Maintenance planning features
- [ ] Integration with supply house systems
- [ ] Mobile app

## 📖 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Extension Development](./docs/EXTENSION.md)
- [Deploying to Production](./docs/DEPLOYMENT.md)

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/masco-intel/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/masco-intel/discussions)
- **Email**: support@mascointe.dev

---

Built with ❤️ for contractors, retailers, and home improvement professionals.
