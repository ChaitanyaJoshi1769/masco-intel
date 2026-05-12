# Getting Started with Masco Intel

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/masco-intel.git
cd masco-intel
```

### Step 2: Install Dependencies

```bash
# Install pnpm if needed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Step 3: Setup Environment

```bash
# Create environment file
cp .env.example .env.local

# Edit .env.local with your settings
# Make sure DATABASE_URL points to your PostgreSQL instance
```

### Step 4: Start Services

```bash
# Option A: Using Docker Compose (recommended)
docker-compose -f infrastructure/docker/docker-compose.yml up

# Option B: Manual setup
# Start PostgreSQL and Redis manually
# Then run migration: pnpm migrate
```

### Step 5: Run Migrations

```bash
cd packages/db
pnpm migrate
cd ../..
```

## Development

### Start Development Server

```bash
# Terminal 1: API Server
cd apps/api
pnpm dev

# Terminal 2: Extension (watch build)
cd apps/extension
pnpm dev
```

### Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Navigate to `apps/extension/dist`
5. Extension appears in your toolbar

### Test the Extension

1. Visit [Home Depot](https://www.homedepot.com) and find a faucet product page
2. Click the Masco Intel icon in your toolbar
3. See product analysis and alternatives
4. Check your browser console for any errors

## Building for Production

### Build All Packages

```bash
pnpm build
```

This creates:
- `apps/extension/dist/` - Chrome extension
- `apps/api/dist/` - API server
- `packages/*/dist/` - Shared packages

### Build Extension for Release

```bash
cd apps/extension
pnpm build

# Zip for Chrome Web Store
zip -r masco-intel.zip dist/
```

### Build Docker Image

```bash
docker build -f infrastructure/docker/Dockerfile.api -t masco-intel-api:latest .
```

## API Usage

### Get Product by SKU

```bash
curl http://localhost:3001/api/products/sku/ABC-123
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "abc123...",
    "sku": "ABC-123",
    "title": "Delta Single Handle Faucet",
    "brand": { "name": "Delta Faucet" },
    "finish": "Chrome",
    "price": 89.99,
    "estimatedGrade": "mid-range"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Find Alternatives

```bash
curl http://localhost:3001/api/products/alternatives?sku=ABC-123&limit=5
```

### Get Quality Analysis

```bash
curl http://localhost:3001/api/quality/abc123/grade-detection
```

Response:
```json
{
  "success": true,
  "data": {
    "grade": "mid-range",
    "confidence": 0.82,
    "reasoning": "Mid-range price point; mixed material composition; standard warranty"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Database

### View Data

```bash
# Open Prisma Studio
pnpm studio
```

Prisma Studio opens at `http://localhost:5555`

### Create Migrations

```bash
cd packages/db

# Make schema changes in prisma/schema.prisma
# Then create migration
pnpm migrate
```

### Seed Data

```bash
# Add seed script to packages/db/prisma/seed.ts
# Then run
pnpm seed
```

## Testing

### Run Tests

```bash
pnpm test
```

### Watch Mode

```bash
pnpm test:watch
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Troubleshooting

### Extension Not Loading

- Check `chrome://extensions` for errors
- Verify manifest.json is valid JSON
- Check browser console for permission issues
- Rebuild: `cd apps/extension && pnpm build`

### API Not Responding

- Check PostgreSQL is running: `docker ps`
- Verify DATABASE_URL in .env.local
- Check API logs: `cd apps/api && pnpm dev`
- API should be at http://localhost:3001

### Database Connection Error

```bash
# Test connection
psql postgresql://user:password@localhost:5432/masco_intel

# Check Docker container
docker logs masco-intel_postgres_1
```

### Extension Cannot Reach API

- Check CORS settings in `apps/api/src/main.ts`
- Verify API URL in `.env.local`
- Check network tab in Chrome DevTools
- Ensure both are running on same machine/network

## Next Steps

1. **Add Product Data**: Create seed data or run scrapers
2. **Customize Retailers**: Add extractors for your retailers
3. **Train Quality Model**: Improve builder-grade detection
4. **Setup CI/CD**: Push to GitHub to trigger workflows
5. **Deploy**: Use Docker to deploy API

## Useful Resources

- [Architecture Guide](./ARCHITECTURE.md)
- [API Reference](./API.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Prisma Docs](https://www.prisma.io/docs/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

## Getting Help

- Check [GitHub Issues](https://github.com/yourusername/masco-intel/issues)
- Join [Discussions](https://github.com/yourusername/masco-intel/discussions)
- Email: support@mascointe.dev
