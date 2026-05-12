import { chromium, Browser, Page } from 'playwright';
import pRetry from 'p-retry';

export class BrowserManager {
  private browser: Browser | null = null;

  async init() {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });
  }

  async newPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    // Avoid detection
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    return page;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export async function fetchWithRetry(
  fn: () => Promise<string>,
  maxAttempts = 3
): Promise<string> {
  return pRetry(fn, {
    retries: maxAttempts - 1,
    minTimeout: 1000,
    maxTimeout: 5000,
  });
}

export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function extractPrice(priceText: string): number {
  const match = priceText.match(/[\d.,]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, ''));
}
