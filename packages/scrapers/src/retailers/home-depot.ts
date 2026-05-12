import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedProduct, ScraperResult } from '../types';
import {
  normalizeFinish,
  normalizeBrand,
  detectProductType,
  detectCertifications,
  extractPrice,
} from '../utils/normalizer';
import { cleanText, fetchWithRetry } from '../utils/browser';

const SEARCH_TERMS = [
  'delta faucet',
  'brizo faucet',
  'hansgrohe faucet',
  'moen faucet',
  'kohler faucet',
  'kitchen faucet chrome',
  'bathroom faucet',
  'faucet cartridge',
  'sink strainer',
];

export async function scrapeHomeDepot(
  searchTerms = SEARCH_TERMS,
  maxProducts = 100
): Promise<ScraperResult> {
  const result: ScraperResult = {
    retailer: 'Home Depot',
    successCount: 0,
    errorCount: 0,
    products: [],
    errors: [],
    startTime: new Date(),
    endTime: new Date(),
  };

  console.log(`🏠 Scraping Home Depot for ${searchTerms.length} search terms...`);

  for (const term of searchTerms) {
    try {
      const products = await searchHomeDepot(term, maxProducts / searchTerms.length);
      result.products.push(...products);
      result.successCount += products.length;
      console.log(`  ✓ "${term}" - Found ${products.length} products`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({ url: `https://www.homedepot.com/s/${term}`, error: errorMsg });
      result.errorCount++;
      console.error(`  ✗ "${term}" - Error: ${errorMsg}`);
    }
  }

  result.endTime = new Date();
  console.log(
    `✓ Home Depot scraping complete: ${result.successCount} products, ${result.errorCount} errors`
  );

  return result;
}

async function searchHomeDepot(searchTerm: string, limit = 20): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];

  // Home Depot search URL
  const searchUrl = `https://www.homedepot.com/s/${encodeURIComponent(searchTerm)}`;

  try {
    const html = await fetchWithRetry(async () => {
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      });
      return response.data;
    });

    const $ = cheerio.load(html);

    // Home Depot product selectors - adjust based on current site structure
    const productSelectors = [
      '[data-testid*="product"]',
      '.product-pod',
      '[class*="product-item"]',
      'div[class*="productPod"]',
    ];

    let productElements = $();
    for (const selector of productSelectors) {
      productElements = $(selector).slice(0, limit);
      if (productElements.length > 0) break;
    }

    productElements.each((_, el) => {
      try {
        const $el = $(el);

        // Extract basic info
        const title = cleanText($el.find('a[title], h2, [data-testid*="title"]').first().text());
        const priceText = cleanText($el.find('[data-testid*="price"], .price').first().text());
        const price = extractPrice(priceText);
        const productUrl = $el.find('a').first().attr('href') || '';
        const imageUrl = $el.find('img').first().attr('src') || '';

        if (!title || price === 0 || !productUrl) {
          return;
        }

        // Extract SKU/MPN from page
        const skuText = cleanText(
          $el.find('[data-testid*="sku"], .item-number, .model-number').text()
        );
        const sku = skuText.replace(/^(SKU|Item|Model)[:\s]*/i, '').trim();

        // Extract specifications
        const specs: Record<string, string> = {};
        $el.find('.spec-item, [class*="specification"]').each((_, spec) => {
          const label = cleanText($(spec).find('.label, dt, .key').text());
          const value = cleanText($(spec).find('.value, dd').text());
          if (label && value) {
            specs[label] = value;
          }
        });

        // Try to extract brand from title
        const brands = ['Delta', 'Brizo', 'Hansgrohe', 'Moen', 'Kohler', 'Peerless', 'Kraus'];
        let brand = 'Unknown';
        for (const b of brands) {
          if (title.toLowerCase().includes(b.toLowerCase())) {
            brand = b;
            break;
          }
        }

        // Detect finish
        let finish = 'Chrome';
        const finishKeywords = [
          'chrome',
          'brushed nickel',
          'oil rubbed bronze',
          'matte black',
          'polished brass',
          'stainless',
          'bronze',
          'gold',
        ];
        for (const fw of finishKeywords) {
          if (title.toLowerCase().includes(fw) || Object.values(specs).some((v) => v.toLowerCase().includes(fw))) {
            finish = normalizeFinish(fw);
            break;
          }
        }

        const product: ScrapedProduct = {
          sku: sku || `HD-${Date.now()}`,
          title: title.substring(0, 255),
          brand: normalizeBrand(brand),
          productType: detectProductType(title, Object.values(specs).join(' ')),
          finish,
          price,
          imageUrl,
          retailerUrl: `https://www.homedepot.com${productUrl}`,
          specifications: specs,
          certifications: detectCertifications(title, specs),
          retailer: 'Home Depot',
        };

        products.push(product);
      } catch (error) {
        // Skip individual product parsing errors
      }
    });
  } catch (error) {
    throw new Error(`Failed to scrape Home Depot search: ${String(error)}`);
  }

  return products.slice(0, limit);
}

// Run if called directly
if (require.main === module) {
  scrapeHomeDepot()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}
