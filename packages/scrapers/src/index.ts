import { PrismaClient } from '@prisma/client';
import { scrapeHomeDepot } from './retailers/home-depot';
import { scrapeLowes } from './retailers/lowes';
import { ScrapedProduct } from './types';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting comprehensive scraper...\n');

  const startTime = Date.now();

  try {
    // Run both scrapers in parallel
    const [homeDepotResult, lowesResult] = await Promise.all([
      scrapeHomeDepot(['delta faucet', 'brizo bathroom', 'hansgrohe kitchen', 'moen faucet'], 50),
      scrapeLowes(['delta faucet', 'brizo bathroom', 'hansgrohe kitchen', 'moen faucet'], 50),
    ]);

    console.log('\n📊 Scraping Summary:');
    console.log(`   Home Depot: ${homeDepotResult.successCount} products, ${homeDepotResult.errorCount} errors`);
    console.log(`   Lowe's: ${lowesResult.successCount} products, ${lowesResult.errorCount} errors`);
    console.log(`   Total: ${homeDepotResult.successCount + lowesResult.successCount} products\n`);

    // Combine results
    const allProducts = [...homeDepotResult.products, ...lowesResult.products];

    // Save to database
    console.log('💾 Saving to database...');
    let savedCount = 0;

    for (const scrapedProduct of allProducts) {
      try {
        await saveProduct(scrapedProduct);
        savedCount++;
      } catch (error) {
        console.error(`   ✗ Failed to save "${scrapedProduct.title}":`, error);
      }
    }

    console.log(`✓ Saved ${savedCount}/${allProducts.length} products\n`);

    // Show statistics
    const stats = await prisma.product.groupBy({
      by: ['brand'],
      _count: true,
    });

    console.log('📈 Products by Brand:');
    stats.forEach((stat) => {
      console.log(`   ${stat.brand}: ${stat._count} products`);
    });

    const priceStats = await prisma.priceHistory.aggregate({
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: true,
    });

    console.log(`\n💰 Price Statistics:`);
    console.log(`   Total Prices: ${priceStats._count}`);
    console.log(`   Avg Price: $${priceStats._avg.price?.toFixed(2) || '0'}`);
    console.log(`   Min Price: $${priceStats._min.price?.toFixed(2) || '0'}`);
    console.log(`   Max Price: $${priceStats._max.price?.toFixed(2) || '0'}`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Scraping completed in ${elapsed}s`);
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function saveProduct(scrapedProduct: ScrapedProduct): Promise<void> {
  // Upsert brand
  const brand = await prisma.brand.upsert({
    where: { name: scrapedProduct.brand },
    update: {},
    create: {
      name: scrapedProduct.brand,
      website: guessWebsite(scrapedProduct.brand),
    },
  });

  // Upsert retailer
  const retailerDomain = getDomainForRetailer(scrapedProduct.retailer);
  const retailer = await prisma.retailer.upsert({
    where: { name: scrapedProduct.retailer },
    update: {},
    create: {
      name: scrapedProduct.retailer,
      domain: retailerDomain,
    },
  });

  // Upsert product (with composite unique key on sku + brand)
  const product = await prisma.product.upsert({
    where: {
      sku_brandId: {
        sku: scrapedProduct.sku,
        brandId: brand.id,
      },
    },
    update: {
      title: scrapedProduct.title,
      description: scrapedProduct.description || undefined,
      specifications: scrapedProduct.specifications,
      certifications: scrapedProduct.certifications,
      imageUrl: scrapedProduct.imageUrl,
    },
    create: {
      sku: scrapedProduct.sku,
      upc: scrapedProduct.upc,
      mpn: scrapedProduct.mpn,
      title: scrapedProduct.title,
      description: scrapedProduct.description,
      brandId: brand.id,
      collection: extractCollection(scrapedProduct.title),
      productType: scrapedProduct.productType,
      finish: scrapedProduct.finish,
      specifications: scrapedProduct.specifications,
      certifications: scrapedProduct.certifications,
      estimatedGrade: estimateGrade(scrapedProduct.price),
      imageUrl: scrapedProduct.imageUrl,
    },
  });

  // Create price history record
  await prisma.priceHistory.create({
    data: {
      productId: product.id,
      retailerId: retailer.id,
      price: scrapedProduct.price,
      msrp: scrapedProduct.msrp,
      url: scrapedProduct.retailerUrl,
      inStock: true,
    },
  });
}

function guessWebsite(brand: string): string | undefined {
  const websites: Record<string, string> = {
    Delta: 'https://www.deltafaucet.com',
    Brizo: 'https://www.brizo.com',
    Hansgrohe: 'https://www.hansgrohe.com',
    Moen: 'https://www.moen.com',
    Kohler: 'https://www.kohler.com',
    Peerless: 'https://www.peerlessfaucet.com',
    Kraus: 'https://www.kraususa.com',
  };
  return websites[brand];
}

function getDomainForRetailer(retailer: string): string {
  const domains: Record<string, string> = {
    'Home Depot': 'homedepot.com',
    Lowes: 'lowes.com',
    Amazon: 'amazon.com',
    Wayfair: 'wayfair.com',
  };
  return domains[retailer] || retailer.toLowerCase().replace(/\s+/g, '');
}

function extractCollection(title: string): string | undefined {
  // Try to extract collection name from title
  const matches = title.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  return matches ? matches[1] : undefined;
}

function estimateGrade(price: number): 'builder-grade' | 'mid-range' | 'premium' | 'luxury' {
  if (price < 75) return 'builder-grade';
  if (price < 200) return 'mid-range';
  if (price < 400) return 'premium';
  return 'luxury';
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
