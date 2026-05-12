# Scraper Guide

This guide explains how to use the data scrapers to populate your Masco Intel database with real products.

## Quick Start

### Run Scrapers Locally

```bash
# Install dependencies
pnpm install

# Start database (if not running)
docker-compose -f infrastructure/docker/docker-compose.yml up

# Run scrapers
cd packages/scrapers
pnpm dev
```

This will:
1. Scrape Home Depot for faucets and plumbing products
2. Scrape Lowe's for similar products
3. Extract specifications, prices, and images
4. Save to PostgreSQL database
5. Display statistics

### Expected Output

```
🚀 Starting comprehensive scraper...

🏠 Scraping Home Depot for 4 search terms...
  ✓ "delta faucet" - Found 12 products
  ✓ "brizo bathroom" - Found 8 products
  ✓ "hansgrohe kitchen" - Found 15 products
  ✓ "moen faucet" - Found 18 products

🏢 Scraping Lowe's for 4 search terms...
  ✓ "delta faucet" - Found 14 products
  ✓ "brizo bathroom" - Found 6 products
  ✓ "hansgrohe kitchen" - Found 12 products
  ✓ "moen faucet" - Found 16 products

📊 Scraping Summary:
   Home Depot: 53 products, 0 errors
   Lowe's: 48 products, 0 errors
   Total: 101 products

💾 Saving to database...
✓ Saved 101/101 products

📈 Products by Brand:
   Delta: 28 products
   Brizo: 16 products
   Hansgrohe: 20 products
   Moen: 37 products

💰 Price Statistics:
   Total Prices: 101
   Avg Price: $156.42
   Min Price: $45.99
   Max Price: $899.99

✅ Scraping completed in 45.23s
```

## Adding New Retailers

### 1. Create Retailer Scraper

```bash
# Create new retailer file
touch packages/scrapers/src/retailers/amazon.ts
```

### 2. Implement Search & Extract

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedProduct, ScraperResult } from '../types';

export async function scrapeAmazon(
  searchTerms: string[],
  maxProducts: number
): Promise<ScraperResult> {
  // Implementation
}

async function searchAmazon(
  searchTerm: string,
  limit: number
): Promise<ScrapedProduct[]> {
  // Extract products from Amazon search results
}
```

### 3. Add to Main Scraper

Update `packages/scrapers/src/index.ts`:

```typescript
import { scrapeAmazon } from './retailers/amazon';

// In main():
const [homeDepotResult, lowesResult, amazonResult] = await Promise.all([
  scrapeHomeDepot(...),
  scrapeLowes(...),
  scrapeAmazon(['delta faucet', 'brizo bathroom'], 50),
]);

const allProducts = [
  ...homeDepotResult.products,
  ...lowesResult.products,
  ...amazonResult.products,
];
```

## Scraper Architecture

### File Structure

```
packages/scrapers/
├── src/
│   ├── index.ts              # Main orchestrator
│   ├── types.ts              # Type definitions
│   ├── utils/
│   │   ├── browser.ts        # Browser automation
│   │   └── normalizer.ts     # Data normalization
│   └── retailers/
│       ├── home-depot.ts     # Home Depot scraper
│       ├── lowes.ts          # Lowe's scraper
│       └── amazon.ts         # (To implement)
└── tests/
    └── retailers.test.ts     # Scraper tests
```

### Scraper Components

#### 1. Browser Manager (`utils/browser.ts`)
- Launches headless Chrome
- Handles anti-detection measures
- Implements retry logic with exponential backoff
- Manages page lifecycle

#### 2. Normalizer (`utils/normalizer.ts`)
- Normalizes finish names (Chrome → Polished Chrome)
- Extracts and validates SKU/MPN
- Detects product type from text
- Identifies certifications (WaterSense, NSF, etc.)

#### 3. Retailer Scrapers
- Search for products
- Extract product details
- Parse pricing and specifications
- Return typed `ScrapedProduct[]`

#### 4. Data Saver (`index.ts`)
- Upserts brands and retailers
- Creates or updates products
- Records price history
- Estimates product grade

## Handling Selectors

Retailers frequently change HTML structure. If scrapers fail:

### 1. Update Selectors

```typescript
// Old selector stopped working
const productElements = $(selector).slice(0, limit);

// Update with new selectors
const productSelectors = [
  '[data-testid="new-product"]',    // Try this first
  '.product-card',                   // Then this
  '[class*="item"]',                 // Then this
  'div[data-qa*="product"]',         // Finally this
];

let productElements = $();
for (const sel of productSelectors) {
  productElements = $(sel).slice(0, limit);
  if (productElements.length > 0) break;  // Found them!
}
```

### 2. Test Individual Selectors

```bash
# Open Playwright inspector
PWDEBUG=1 pnpm dev
```

### 3. Update Fallbacks

```typescript
// If title selector fails, try alternatives
const titleSelectors = [
  'h2[data-testid="title"]',
  'a[title]',
  '.product-name',
  '[class*="title"]',
];

let title = '';
for (const sel of titleSelectors) {
  title = cleanText($(sel).first().text());
  if (title) break;
}
```

## Performance Optimization

### Parallel Scraping

```typescript
// Scrape multiple retailers in parallel
const [hdResult, lowesResult, amazonResult] = await Promise.all([
  scrapeHomeDepot(terms, 100),
  scrapeLowes(terms, 100),
  scrapeAmazon(terms, 100),
]);
```

### Batch Database Saves

```typescript
// Save in batches instead of one-by-one
const batchSize = 50;
for (let i = 0; i < products.length; i += batchSize) {
  const batch = products.slice(i, i + batchSize);
  await Promise.all(batch.map(p => saveProduct(p)));
}
```

### Caching & Deduplication

```typescript
// Keep track of seen SKUs to avoid duplicates
const seenSkus = new Set<string>();

for (const product of products) {
  if (seenSkus.has(product.sku)) continue;  // Skip duplicate
  seenSkus.add(product.sku);
  // Process product
}
```

## Automated Scheduling

### GitHub Actions

Scrapers run automatically every day at 2 AM UTC:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

Trigger manually:
```bash
# Via GitHub CLI
gh workflow run scrape.yml

# Via GitHub web UI
# Settings → Actions → Scraping → Run workflow
```

### Local Scheduling (with node-cron)

```bash
pnpm add node-cron

# Then in index.ts:
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled scraper...');
  await runScrapers();
});
```

## Monitoring & Alerts

### Log Scraper Results

```typescript
// Results stored in database for analysis
const log = await prisma.scraperLog.create({
  data: {
    retailer: result.retailer,
    status: result.errorCount === 0 ? 'success' : 'partial',
    itemsProcessed: result.successCount,
    errors: result.errors.map(e => e.error),
    startedAt: result.startTime,
    completedAt: result.endTime,
  },
});
```

### Query Scraping History

```bash
curl http://localhost:3001/api/scraper-logs?retailer=Home%20Depot&days=7
```

## Troubleshooting

### Scraper Times Out

```typescript
// Increase timeout
const response = await axios.get(url, {
  timeout: 20000,  // 20 seconds
});
```

### Selectors Return Empty

```typescript
// Debug by saving HTML
const fs = require('fs');
fs.writeFileSync('debug.html', html);
// Open debug.html in browser to inspect structure
```

### Rate Limited

```typescript
// Add delay between requests
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay

// Implement proxy rotation
const proxies = ['proxy1.com', 'proxy2.com'];
const proxy = proxies[Math.floor(Math.random() * proxies.length)];
```

### Database Lock

```bash
# If database is locked, restart:
docker-compose down -v
docker-compose up
```

## Best Practices

✅ **Do:**
- Use retry logic for flaky networks
- Normalize data consistently
- Log errors for debugging
- Test with small datasets first
- Batch database operations
- Respect robots.txt and rate limits

❌ **Don't:**
- Make too many requests in parallel
- Skip error handling
- Hardcode selectors without fallbacks
- Store credentials in code
- Ignore robots.txt

## API Integration

After scraping, query your API:

```bash
# Search products
curl http://localhost:3001/api/products/search?q=delta

# Get price comparisons
curl http://localhost:3001/api/pricing/\{productId\}/comparison

# View in extension
# Extension automatically shows scraped products on retailer pages!
```

## Next Steps

1. **Test locally** - Run `pnpm dev` and verify data loads
2. **Add more retailers** - Follow the Amazon scraper template
3. **Deploy** - Push to GitHub, CI/CD runs scrapers daily
4. **Monitor** - Check scraper logs in database
5. **Improve** - Fix selectors as retailers update their sites

---

**Questions?** Check [CONTRIBUTING.md](./CONTRIBUTING.md) or open a GitHub issue.
