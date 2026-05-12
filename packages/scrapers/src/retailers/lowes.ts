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
  'sink faucet',
  'bathroom faucet',
  'kitchen sink',
  'faucet cartridge',
  'bathroom hardware',
];

export async function scrapeLowes(
  searchTerms = SEARCH_TERMS,
  maxProducts = 100
): Promise<ScraperResult> {
  const result: ScraperResult = {
    retailer: 'Lowes',
    successCount: 0,
    errorCount: 0,
    products: [],
    errors: [],
    startTime: new Date(),
    endTime: new Date(),
  };

  console.log(`🏢 Scraping Lowe's for ${searchTerms.length} search terms...`);

  for (const term of searchTerms) {
    try {
      const products = await searchLowes(term, maxProducts / searchTerms.length);
      result.products.push(...products);
      result.successCount += products.length;
      console.log(`  ✓ "${term}" - Found ${products.length} products`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({ url: `https://www.lowes.com/search?searchTerm=${term}`, error: errorMsg });
      result.errorCount++;
      console.error(`  ✗ "${term}" - Error: ${errorMsg}`);
    }
  }

  result.endTime = new Date();
  console.log(
    `✓ Lowe's scraping complete: ${result.successCount} products, ${result.errorCount} errors`
  );

  return result;
}

async function searchLowes(searchTerm: string, limit = 20): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];

  const searchUrl = `https://www.lowes.com/search?searchTerm=${encodeURIComponent(searchTerm)}`;

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

    // Lowe's product selectors
    const productSelectors = [
      '[data-qa="product-list-item"]',
      '.product-card-container',
      '[class*="productCard"]',
      '[class*="product-item"]',
    ];

    let productElements = $();
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        productElements = elements.length > limit ? elements.slice(0, limit) : elements;
        break;
      }
    }

    productElements.each((_: number, el: any) => {
      try {
        const $el = $(el);

        // Extract product info
        const title = cleanText($el.find('h2, [class*="title"], a[href*="/p/"]').first().text());
        const priceText = cleanText($el.find('[class*="price"], [data-qa*="price"]').first().text());
        const price = extractPrice(priceText);
        const productLink = $el.find('a[href*="/p/"]').first().attr('href') || '';
        const imageUrl = $el.find('img[alt]').first().attr('src') || '';

        if (!title || price === 0 || !productLink) {
          return;
        }

        // Extract model number
        const modelText = cleanText(
          $el.find('[class*="model"], [data-qa*="model"]').text()
        );
        const modelMatch = modelText.match(/Model[:\s]*([A-Z0-9\-]+)/i);
        const sku = modelMatch ? modelMatch[1] : `LOWES-${Date.now()}`;

        // Extract specifications
        const specs: Record<string, string> = {};
        $el.find('[class*="spec"], [data-qa*="specification"]').each((_, spec) => {
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
          retailerUrl: `https://www.lowes.com${productLink}`,
          specifications: specs,
          certifications: detectCertifications(title, specs),
          retailer: 'Lowes',
        };

        products.push(product);
      } catch (error) {
        // Skip individual product parsing errors
      }
    });
  } catch (error) {
    throw new Error(`Failed to scrape Lowe's search: ${String(error)}`);
  }

  return products.slice(0, limit);
}

// Run if called directly
if (require.main === module) {
  scrapeLowes()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}
