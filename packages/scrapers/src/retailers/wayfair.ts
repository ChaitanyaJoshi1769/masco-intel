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
  'brizo bathroom',
  'hansgrohe kitchen',
  'moen faucet',
  'kohler faucet',
  'bathroom faucet',
  'kitchen sink faucet',
  'modern faucet',
];

export async function scrapeWayfair(
  searchTerms = SEARCH_TERMS,
  maxProducts = 100
): Promise<ScraperResult> {
  const result: ScraperResult = {
    retailer: 'Wayfair',
    successCount: 0,
    errorCount: 0,
    products: [],
    errors: [],
    startTime: new Date(),
    endTime: new Date(),
  };

  console.log(`🛋️ Scraping Wayfair for ${searchTerms.length} search terms...`);

  for (const term of searchTerms) {
    try {
      const products = await searchWayfair(term, maxProducts / searchTerms.length);
      result.products.push(...products);
      result.successCount += products.length;
      console.log(`  ✓ "${term}" - Found ${products.length} products`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({ url: `https://www.wayfair.com/keyword.php?keyword=${term}`, error: errorMsg });
      result.errorCount++;
      console.error(`  ✗ "${term}" - Error: ${errorMsg}`);
    }
  }

  result.endTime = new Date();
  console.log(
    `✓ Wayfair scraping complete: ${result.successCount} products, ${result.errorCount} errors`
  );

  return result;
}

async function searchWayfair(searchTerm: string, limit = 20): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];

  const searchUrl = `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(searchTerm)}`;

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

    // Wayfair product selectors
    const productSelectors = [
      '[data-testid="ProductCardWithImage"]',
      '.ProductCard',
      '[class*="ProductCard"]',
      '[class*="product-item"]',
      '.ProductCardLegacy',
    ];

    let productElements = $();
    for (const selector of productSelectors) {
      productElements = $(selector).slice(0, limit);
      if (productElements.length > 0) break;
    }

    productElements.each((_, el) => {
      try {
        const $el = $(el);

        // Extract title
        const title = cleanText($el.find('h2, a[href*="/RCP"]').first().text());

        // Extract price
        const priceText = cleanText($el.find('[class*="Price"]').first().text());
        const price = extractPrice(priceText);

        // Extract product URL
        const productLink = $el.find('a[href*="/RCP"]').first().attr('href') || '';

        // Extract image
        const imageUrl = $el.find('img').first().attr('src') || '';

        if (!title || price === 0 || !productLink) {
          return;
        }

        // Extract SKU from URL or data attributes
        const skuMatch = productLink.match(/\/RCP(\d+)/);
        const sku = skuMatch ? `WAYFAIR-${skuMatch[1]}` : `WAYFAIR-${Date.now()}`;

        // Extract specifications
        const specs: Record<string, string> = {};
        $el.find('[class*="specification"]').each((_, spec) => {
          const label = cleanText($(spec).find('[class*="label"]').text());
          const value = cleanText($(spec).find('[class*="value"]').text());
          if (label && value) {
            specs[label] = value;
          }
        });

        // Brand detection
        const brands = ['Delta', 'Brizo', 'Hansgrohe', 'Moen', 'Kohler', 'Peerless', 'Kraus'];
        let brand = 'Unknown';
        for (const b of brands) {
          if (title.toLowerCase().includes(b.toLowerCase())) {
            brand = b;
            break;
          }
        }

        // Finish detection
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
          'finish',
        ];
        for (const fw of finishKeywords) {
          if (title.toLowerCase().includes(fw) || Object.values(specs).some((v) => v.toLowerCase().includes(fw))) {
            finish = normalizeFinish(fw);
            break;
          }
        }

        const product: ScrapedProduct = {
          sku,
          title: title.substring(0, 255),
          brand: normalizeBrand(brand),
          productType: detectProductType(title, Object.values(specs).join(' ')),
          finish,
          price,
          imageUrl,
          retailerUrl: `https://www.wayfair.com${productLink}`,
          specifications: specs,
          certifications: detectCertifications(title, specs),
          retailer: 'Wayfair',
        };

        products.push(product);
      } catch (error) {
        // Skip individual product errors
      }
    });
  } catch (error) {
    throw new Error(`Failed to scrape Wayfair search: ${String(error)}`);
  }

  return products.slice(0, limit);
}

// Run if called directly
if (require.main === module) {
  scrapeWayfair()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}
