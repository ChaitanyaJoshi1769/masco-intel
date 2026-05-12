# 🚀 Quick Start - Run Everything

Get the complete Masco Intel system running in 5 minutes.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

## 1. Clone & Install (2 min)

```bash
git clone https://github.com/yourusername/masco-intel.git
cd masco-intel
pnpm install
```

## 2. Start Services (1 min)

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up
```

Keep this running. You should see:
```
postgres_1 | database system is ready to accept connections
redis_1    | Ready to accept connections
```

## 3. In New Terminal: Run Migrations (30 sec)

```bash
cd packages/db
pnpm migrate
```

Output:
```
✓ 1 migration applied
```

## 4. Seed Test Data (30 sec)

```bash
pnpm seed
```

Output:
```
✓ Database seeded successfully!
   - 2 brands
   - 3 retailers
   - 2 products
   - 3 price records
```

## 5. Start API Server (30 sec)

```bash
cd ../api
pnpm dev
```

Output:
```
✓ Masco Intel API running on http://localhost:3001
```

## 6. In Another Terminal: Build & Load Extension (1 min)

```bash
cd apps/extension
pnpm build
```

Then load in Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist` folder
5. Icon appears in toolbar ✓

## 7. Test the System

### Test API
```bash
curl http://localhost:3001/health
# {"status":"ok","service":"masco-intel-api","version":"0.1.0"}

curl http://localhost:3001/api/products/search?q=delta
# Returns products from seed data
```

### Test Extension
1. Click Masco Intel icon in toolbar
2. Should show "No Product Detected" (or product data if on supported retailer)
3. See dark-themed popup UI ✓

## 8. (Optional) Populate with Real Data

```bash
cd packages/scrapers
pnpm dev
```

This scrapes Home Depot and Lowe's, loads 100+ real products into database.

Output:
```
✅ Scraping completed in 45.23s
📈 101 products saved
💰 Avg price: $156.42
```

---

## 🎯 Common Commands

### Start Everything (from root)
```bash
# Terminal 1: Services
docker-compose -f infrastructure/docker/docker-compose.yml up

# Terminal 2: API
cd apps/api && pnpm dev

# Terminal 3: Extension (watch build)
cd apps/extension && pnpm dev

# Terminal 4: Scrapers (populate data)
cd packages/scrapers && pnpm dev
```

### Database
```bash
pnpm db:migrate      # Run migrations
pnpm db:seed         # Load test data
pnpm db:studio       # Open Prisma Studio (GUI)
```

### Scraping
```bash
pnpm scrape                # Run all scrapers
pnpm scrape:homedepot      # Home Depot only
pnpm scrape:lowes          # Lowe's only
```

### Development
```bash
pnpm dev             # Dev all packages
pnpm build           # Build all packages
pnpm type-check      # Check TypeScript
pnpm lint            # Lint code
pnpm test            # Run tests
```

---

## 📊 What You're Running

| Component | Port | Status |
|-----------|------|--------|
| PostgreSQL | 5432 | ✓ |
| Redis | 6379 | ✓ |
| API | 3001 | ✓ |
| Prisma Studio | 5555 | Optional |
| Chrome Extension | - | ✓ |

---

## 🔍 Verify Everything Works

**API Health Check:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

**Database Check:**
```bash
pnpm db:studio
# Should open Prisma Studio with data visible
```

**Extension Check:**
1. Visit any supported retailer (Home Depot, Lowe's, Amazon, Wayfair)
2. Click Masco Intel icon
3. Should attempt to extract product data

---

## 🆘 Troubleshooting

### "Can't connect to database"
```bash
# Check Docker is running
docker ps

# Restart services
docker-compose down
docker-compose up
```

### "Port 3001 already in use"
```bash
# Kill process using port 3001
lsof -i :3001
kill -9 <PID>
```

### "Extension won't load"
```bash
cd apps/extension
pnpm clean
pnpm build
# Reload in Chrome (or click reload icon)
```

### "Scraper fails"
```bash
# Check database is running
docker ps

# Check migrations applied
cd packages/db && pnpm migrate

# Try scraping again
cd packages/scrapers && pnpm dev
```

---

## 📚 Full Guides

- [VERIFY_SETUP.md](./VERIFY_SETUP.md) - Detailed verification checklist
- [SCRAPER_GUIDE.md](./SCRAPER_GUIDE.md) - Scraper details & customization
- [docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md) - In-depth setup
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design
- [README.md](./README.md) - Feature overview

---

## ✨ What's Next?

1. ✅ **System is running** - All services operational
2. 📊 **Real data loaded** - Scrapers populate 100+ products
3. 🧪 **Ready to develop** - All code hot-reloads
4. 🚀 **Ready to deploy** - Docker images, CI/CD ready

### Try These:

- Modify extension popup (hot-reloads instantly)
- Add new API endpoint
- Improve builder-grade detection
- Customize scraper selectors
- Add new retailer

---

**Feeling stuck?** See [CONTRIBUTING.md](./CONTRIBUTING.md) for dev guidelines.

**Questions?** Check [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for how everything connects.

**Ready to deploy?** See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) (when ready).

---

**Built with ❤️ for contractors and home improvement pros.**
