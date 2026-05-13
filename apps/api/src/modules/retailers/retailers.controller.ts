import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { MenardsScraperService } from './menards-scraper.service';
import { AceHardwareScraperService } from './ace-hardware-scraper.service';

@Controller('retailers')
export class RetailersController {
  constructor(
    private menardsService: MenardsScraperService,
    private aceService: AceHardwareScraperService,
  ) {}

  /**
   * Scrape Menards for products
   * POST /retailers/menards/scrape?category=faucets
   */
  @Post('menards/scrape')
  async scrapeMenards(@Param('category') category = 'faucets') {
    const result = await this.menardsService.scrapeProducts(category);
    return {
      success: true,
      retailer: 'Menards',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Scrape ACE Hardware for products
   * POST /retailers/ace/scrape?category=faucets
   */
  @Post('ace/scrape')
  async scrapeAce(@Param('category') category = 'faucets') {
    const result = await this.aceService.scrapeProducts(category);
    return {
      success: true,
      retailer: 'ACE Hardware',
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Scrape all retailers
   * POST /retailers/scrape-all
   * Body: { categories?: string[] }
   */
  @Post('scrape-all')
  async scrapeAll(
    @Body() body: { categories?: string[] }
  ) {
    const categories = body.categories || ['faucets'];
    const results = {
      menards: { success: false, data: null as any },
      ace: { success: false, data: null as any },
    };

    for (const category of categories) {
      try {
        results.menards = {
          success: true,
          data: await this.menardsService.scrapeProducts(category)
        };
      } catch (error) {
        results.menards.data = { error: error instanceof Error ? error.message : 'Failed' };
      }

      try {
        results.ace = {
          success: true,
          data: await this.aceService.scrapeProducts(category)
        };
      } catch (error) {
        results.ace.data = { error: error instanceof Error ? error.message : 'Failed' };
      }
    }

    return {
      success: results.menards.success && results.ace.success,
      data: results,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get supported retailers
   * GET /retailers/supported
   */
  @Get('supported')
  getSupportedRetailers() {
    return {
      success: true,
      data: {
        retailers: [
          {
            name: 'Home Depot',
            domain: 'homedepot.com',
            status: 'active',
            productsScraped: 'estimated 200+',
          },
          {
            name: 'Lowe\'s',
            domain: 'lowes.com',
            status: 'active',
            productsScraped: 'estimated 200+',
          },
          {
            name: 'Menards',
            domain: 'menards.com',
            status: 'active',
            productsScraped: 'estimated 45',
          },
          {
            name: 'ACE Hardware',
            domain: 'acehardware.com',
            status: 'active',
            productsScraped: 'estimated 40',
          },
        ],
        totalRetailers: 4,
        totalProductsScraped: 'estimated 685+',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
