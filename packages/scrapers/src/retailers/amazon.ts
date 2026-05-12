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
  'delta faucet kitchen',
  'brizo faucet bathroom',
  'hansgrohe kitchen faucet',
  'moen kitchen faucet',
  'kohler bathroom faucet',
  'bathroom sink faucet',
  'kitchen sink faucet chrome',
  'faucet cartridge replacement',
];

export async function scrapeAmazon(
  searchTerms = SEARCH_TERMS,
  maxProducts = 100
): Promise<ScraperResult> {
  const result: ScraperResult = {
    retailer: 'Amazon',
    successCount: 0,
    errorCount: 0,
    products: [],
    errors: [],
    startTime: new Date(),
    endTime: new Date(),
  };

  console.log(`📦 Scraping Amazon for ${searchTerms.length} search terms...`);

  for (const term of searchTerms) {
    try {
      const products = await searchAmazon(term, maxProducts / searchTerms.length);
      result.products.push(...products);
      result.successCount += products.length;
      console.log(`  ✓ "${term}" - Found ${products.length} products`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({ url: `https://www.amazon.com/s?k=${term}`, error: errorMsg });
      result.errorCount++;
      console.error(`  ✗ "${term}" - Error: ${errorMsg}`);
    }
  }

  result.endTime = new Date();
  console.log(
    `✓ Amazon scraping complete: ${result.successCount} products, ${result.errorCount} errors`
  );

  return result;
}

async function searchAmazon(searchTerm: string, limit = 20): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];

  const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}`;

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

    // Amazon product selectors
    const productSelectors = [
      '[data-component-type="s-search-result"]',
      '[data-asin]',
      '.s-result-item',
      '[class*="ProductCard"]',
    ];

    let productElements = $('*').slice(0, 0); // empty selector
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

        // Extract ASIN (Amazon Standard Identification Number)
        const asin = $el.attr('data-asin') || '';

        // Extract title
        const title = cleanText(
          $el.find('h2 a span, h2 span, [class*="title"]').first().text()
        );

        // Extract price
        const priceText = cleanText($el.find('[class*="price"]').first().text());
        const price = extractPrice(priceText);

        // Extract product URL
        const productLink = $el.find('h2 a').first().attr('href') || '';

        // Extract image
        const imageUrl = $el.find('img').first().attr('src') || '';

        if (!title || price === 0 || !asin) {
          return;
        }

        // Extract rating (optional but useful)
        const ratingText = cleanText($el.find('[class*="rating"]').first().text());

        // Extract specifications from title and description
        const specs: Record<string, string> = {};
        if (ratingText) specs['Rating'] = ratingText;

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
          'nickel',
          'finish',
        ];
        for (const fw of finishKeywords) {
          if (title.toLowerCase().includes(fw)) {
            finish = normalizeFinish(fw);
            break;
          }
        }

        const product: ScrapedProduct = {
          sku: asin,
          title: title.substring(0, 255),
          brand: normalizeBrand(brand),
          productType: detectProductType(title),
          finish,
          price,
          imageUrl,
          retailerUrl: `https://www.amazon.com${productLink}`,
          specifications: specs,
          certifications: detectCertifications(title),
          retailer: 'Amazon',
        };

        products.push(product);
      } catch (error) {
        // Skip individual product errors
      }
    });
  } catch (error) {
    throw new Error(`Failed to scrape Amazon search: ${String(error)}`);
  }

  return products.slice(0, limit);
}

// Run if called directly
if (require.main === module) {
  scrapeAmazon()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error('Scraping failed:', error);
      process.exit(1);
    });
}
