# Verify Your Masco Intel Setup

This guide walks you through verifying that everything is set up correctly and ready to develop.

## ✅ Pre-Flight Checklist

### 1. Check Dependencies

```bash
# Node.js 20+
node --version
# Should output: v20.x.x or higher

# pnpm
pnpm --version
# Should output: 9.x.x or higher

# Docker
docker --version
docker-compose --version
```

### 2. Install Dependencies

```bash
cd /Users/jay/Masco
pnpm install
# Should complete without errors
```

### 3. Verify Project Structure

```bash
# Check that all key directories exist
ls -la apps/extension/src/
ls -la apps/api/src/
ls -la packages/db/prisma/
ls -la packages/shared/src/
```

## 🗄️ Database Setup

### 1. Start PostgreSQL & Redis

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up
```

You should see:
```
postgres_1  | database system is ready to accept connections
redis_1     | Ready to accept connections
api_1       | Masco Intel API running on http://localhost:3001
```

### 2. Test Database Connection

```bash
# From another terminal
psql postgresql://masco:masco_dev@localhost:5432/masco_intel -c "SELECT version();"
```

Should return PostgreSQL version info.

### 3. Run Migrations

```bash
cd packages/db
pnpm migrate
# Should apply all migrations successfully
```

### 4. Seed Test Data

```bash
pnpm seed
# Should output:
# 🌱 Seeding database...
# ✅ Database seeded successfully!
```

### 5. Verify Data

```bash
pnpm studio
# Opens Prisma Studio at http://localhost:5555
# You should see 2 brands, 3 retailers, and 2 products
```

## 🔌 API Server

### 1. Start API in Development

```bash
cd apps/api
pnpm dev
```

You should see:
```
[Nest] XX  - 01/15/2024, 10:30:00 AM   LOG [NestFactory] Starting Nest application...
✓ Masco Intel API running on http://localhost:3001
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "service": "masco-intel-api",
  "version": "0.1.0"
}
```

### 3. Test Product Endpoints

```bash
# Create a product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TEST-001",
    "title": "Test Faucet",
    "brand": "Test Brand",
    "productType": "faucet",
    "finish": "Chrome",
    "price": 99.99
  }'

# Search products
curl "http://localhost:3001/api/products/search?q=Test"

# Get by SKU
curl "http://localhost:3001/api/products/sku/TEST-001"
```

All should return 200 OK with data.

## 🧩 Chrome Extension

### 1. Build Extension

```bash
cd apps/extension
pnpm build
```

Should complete without errors and create `dist/` directory with:
- `manifest.json`
- `popup.html`
- `content.js`
- `background.js`
- CSS files

### 2. Load in Chrome

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Navigate to `/Users/jay/Masco/apps/extension/dist`
6. Extension should appear in toolbar with Masco Intel icon

### 3. Test Extension UI

1. Click Masco Intel icon in toolbar
2. Should open popup with:
   - "No Product Detected" message (or product analysis if on supported retailer)
   - Clean dark-themed UI
   - Responsive design

### 4. Test on Retailers

Visit these pages and click extension:
- https://www.homedepot.com/p/Delta-Lahara-Single-Handle-Kitchen-Faucet-25984LF-PC/206032761
- https://www.lowes.com/search?searchTerm=delta+faucet
- https://www.amazon.com/s?k=delta+faucet

Extension should attempt to extract product data.

## 📊 Type Checking

### 1. Check All TypeScript

```bash
cd /Users/jay/Masco
pnpm type-check
```

Should complete with no errors (0 errors found).

### 2. Check Individual Packages

```bash
cd apps/api && pnpm type-check
cd apps/extension && pnpm type-check
cd packages/shared && pnpm type-check
cd packages/db && pnpm type-check
```

All should pass.

## 🧪 Testing

### 1. Run Tests

```bash
pnpm test
```

All tests should pass (or show "no tests found" if none written yet).

### 2. Watch Mode

```bash
pnpm test:watch
```

Should start Jest in watch mode.

## 📦 Building for Production

### 1. Build Everything

```bash
pnpm build
```

Should create:
- `apps/extension/dist/` - Extension files
- `apps/api/dist/` - Compiled API server
- `packages/*/dist/` - Compiled packages

### 2. Build Docker Image

```bash
docker build -f infrastructure/docker/Dockerfile.api -t masco-intel-api:latest .
```

Should complete successfully.

### 3. Run Docker Container

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://masco:masco_dev@host.docker.internal:5432/masco_intel" \
  masco-intel-api:latest
```

Should start and connect to database.

## 🔍 Project Verification

### 1. Check File Count

```bash
find /Users/jay/Masco -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" | wc -l
```

Should be 50+ files.

### 2. Check Monorepo Structure

```bash
pnpm list
```

Should show all packages linked:
- @masco/shared
- @masco/db
- @masco/extension
- @masco/api

### 3. View Git History

```bash
git log --oneline
```

Should show initial commit with all files.

## 🚀 Everything Works When...

✅ **Database**
- [ ] Docker Compose starts without errors
- [ ] Migrations apply successfully
- [ ] Seed data loads
- [ ] Prisma Studio shows 2 brands, 3 retailers, 2 products

✅ **API**
- [ ] API starts on port 3001
- [ ] Health endpoint returns `"status": "ok"`
- [ ] Can create products
- [ ] Can search products
- [ ] All 20+ endpoints respond correctly

✅ **Extension**
- [ ] Builds without errors
- [ ] Loads in Chrome without warnings
- [ ] Icon visible in toolbar
- [ ] Popup displays correctly
- [ ] No console errors

✅ **TypeScript**
- [ ] `pnpm type-check` reports 0 errors
- [ ] All packages type-check individually
- [ ] No `any` types in core code

✅ **Git**
- [ ] Repository initialized
- [ ] All 54 files committed
- [ ] Initial commit present

## 🆘 Troubleshooting

### Docker won't start
```bash
# Check Docker is running
docker ps

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs

# Reset everything
docker-compose down -v
docker-compose up
```

### API won't compile
```bash
cd apps/api
pnpm clean
pnpm build
```

### Extension won't load
```bash
cd apps/extension
pnpm clean
pnpm build
# Then reload in Chrome (or use Dev Mode reload)
```

### Database won't migrate
```bash
cd packages/db
# Check connection
psql postgresql://masco:masco_dev@localhost:5432/masco_intel -c "SELECT 1"
# Reset migrations (dev only!)
pnpm migrate reset
```

### Port conflicts
```bash
# Find what's using port 3001
lsof -i :3001
kill -9 <PID>

# Find what's using port 5432 (PostgreSQL)
lsof -i :5432
kill -9 <PID>
```

## ✨ You're Ready!

When all items are checked, you have a fully functional, production-grade development environment ready for:

1. **Development** - Hot reload for both extension and API
2. **Testing** - Run tests, type checking, linting
3. **Deployment** - Docker images, CI/CD pipelines
4. **Production** - Scalable, enterprise-grade architecture

## Next Steps

1. Read [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)
2. Review [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
3. Start building features
4. Commit to GitHub to trigger CI/CD
5. Deploy to production!

---

**Questions?** See [CONTRIBUTING.md](./CONTRIBUTING.md) or check issues on GitHub.
