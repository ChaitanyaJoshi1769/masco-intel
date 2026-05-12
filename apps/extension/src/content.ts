import { ExtensionMessage, Product } from '@masco/shared';

interface PageProduct {
  sku?: string;
  title?: string;
  price?: number;
  imageUrl?: string;
  retailer?: string;
  url?: string;
  specifications?: Record<string, string>;
}

const extractProductFromPage = (): PageProduct | null => {
  const url = window.location.href;

  // Home Depot
  if (url.includes('homedepot.com')) {
    return extractHomeDepotProduct();
  }

  // Lowe's
  if (url.includes('lowes.com')) {
    return extractLowesProduct();
  }

  // Amazon
  if (url.includes('amazon.com')) {
    return extractAmazonProduct();
  }

  // Wayfair
  if (url.includes('wayfair.com')) {
    return extractWayfairProduct();
  }

  return null;
};

const extractHomeDepotProduct = (): PageProduct | null => {
  try {
    const titleEl = document.querySelector('[data-testid="product_title"]') || document.querySelector('h1');
    const priceEl = document.querySelector('[data-testid="product_price"]');
    const skuEl = document.querySelector('[data-testid="product_sku"]');
    const imageEl = document.querySelector('img[alt*="product"]') as HTMLImageElement;

    return {
      title: titleEl?.textContent || undefined,
      price: priceEl ? parseFloat(priceEl.textContent?.replace(/[^\d.]/g, '') || '0') : undefined,
      sku: skuEl?.textContent?.split(':')[1]?.trim() || undefined,
      imageUrl: imageEl?.src || undefined,
      retailer: 'Home Depot',
      url: window.location.href,
      specifications: extractSpecifications(),
    };
  } catch {
    return null;
  }
};

const extractLowesProduct = (): PageProduct | null => {
  try {
    const titleEl = document.querySelector('h1') || document.querySelector('[data-qa="product_title"]');
    const priceEl = document.querySelector('[data-qa="product_price"]');
    const imageEl = document.querySelector('img[alt*="product"]') as HTMLImageElement;

    const modelNumber = document.querySelector('[data-qa="product_model"]')?.textContent || undefined;

    return {
      title: titleEl?.textContent || undefined,
      price: priceEl ? parseFloat(priceEl.textContent?.replace(/[^\d.]/g, '') || '0') : undefined,
      sku: modelNumber,
      imageUrl: imageEl?.src || undefined,
      retailer: 'Lowes',
      url: window.location.href,
      specifications: extractSpecifications(),
    };
  } catch {
    return null;
  }
};

const extractAmazonProduct = (): PageProduct | null => {
  try {
    const titleEl = document.querySelector('h1 span') || document.getElementById('productTitle');
    const priceEl = document.querySelector('.a-price-whole');
    const imageEl = document.getElementById('landingImage') as HTMLImageElement;
    const asinEl = document.querySelector('[data-feature-name="asin"]');

    return {
      title: titleEl?.textContent || undefined,
      price: priceEl ? parseFloat(priceEl.textContent?.replace(/[^\d.]/g, '') || '0') : undefined,
      sku: asinEl?.textContent || undefined,
      imageUrl: imageEl?.src || undefined,
      retailer: 'Amazon',
      url: window.location.href,
      specifications: extractSpecifications(),
    };
  } catch {
    return null;
  }
};

const extractWayfairProduct = (): PageProduct | null => {
  try {
    const titleEl = document.querySelector('h1');
    const priceEl = document.querySelector('.PriceDisplay__Price');
    const imageEl = document.querySelector('img[alt*="product"]') as HTMLImageElement;
    const skuEl = document.querySelector('[data-testid="sku"]');

    return {
      title: titleEl?.textContent || undefined,
      price: priceEl ? parseFloat(priceEl.textContent?.replace(/[^\d.]/g, '') || '0') : undefined,
      sku: skuEl?.textContent || undefined,
      imageUrl: imageEl?.src || undefined,
      retailer: 'Wayfair',
      url: window.location.href,
      specifications: extractSpecifications(),
    };
  } catch {
    return null;
  }
};

const extractSpecifications = (): Record<string, string> => {
  const specs: Record<string, string> = {};
  const specElements = document.querySelectorAll('[data-testid*="spec"], .spec-item, [class*="specification"]');

  specElements.forEach((el) => {
    const label = el.querySelector('[class*="label"], dt, .key')?.textContent || '';
    const value = el.querySelector('[class*="value"], dd, .value')?.textContent || '';
    if (label && value) {
      specs[label.trim()] = value.trim();
    }
  });

  return specs;
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === 'EXTRACT_PRODUCT') {
    const product = extractProductFromPage();
    sendResponse(product || { error: 'Could not extract product data' });
  }
});

// Inject UI badge on product cards (optional)
const injectProductBadges = () => {
  const productElements = document.querySelectorAll('[data-testid*="product"], [class*="product-card"]');

  productElements.forEach((el) => {
    if (!el.querySelector('.masco-intel-badge')) {
      const badge = document.createElement('div');
      badge.className = 'masco-intel-badge';
      badge.innerHTML = '📊 Intel Available';
      badge.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        z-index: 10;
      `;
      el.style.position = 'relative';
      el.appendChild(badge);
    }
  });
};

// Run initial extraction
injectProductBadges();
