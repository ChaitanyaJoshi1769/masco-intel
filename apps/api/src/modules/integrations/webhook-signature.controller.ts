import { Controller, Post, Get, Body, Headers, Param } from '@nestjs/common';
import { WebhookSignatureService } from './webhook-signature.service';

@Controller('webhook-signature')
export class WebhookSignatureController {
  constructor(private readonly service: WebhookSignatureService) {}

  /**
   * Verify webhook signature for a specific provider
   * POST /webhook-signature/verify/:provider
   */
  @Post('verify/:provider')
  async verifyWebhook(
    @Param('provider') provider: string,
    @Body()
    body: {
      payload: string;
      signature: string;
      secret: string;
      headers?: Record<string, string>;
    }
  ) {
    const result = await this.service.verifySignature(
      provider,
      body.payload,
      body.signature,
      body.secret,
      body.headers
    );

    return {
      success: result.valid,
      data: result,
      message: result.valid ? 'Webhook signature valid' : 'Webhook signature invalid',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify Shopify webhook
   * POST /webhook-signature/shopify/verify
   */
  @Post('shopify/verify')
  async verifyShopifyWebhook(
    @Body()
    body: {
      payload: string;
      signature: string;
      apiSecret: string;
    }
  ) {
    const isValid = await this.service.verifyShopifyWebhook(
      body.payload,
      body.signature,
      body.apiSecret
    );

    return {
      success: isValid,
      data: { provider: 'shopify', valid: isValid },
      message: isValid ? 'Shopify webhook valid' : 'Shopify webhook invalid',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify WooCommerce webhook
   * POST /webhook-signature/woocommerce/verify
   */
  @Post('woocommerce/verify')
  async verifyWooCommerceWebhook(
    @Body()
    body: {
      payload: string;
      signature: string;
      consumerSecret: string;
    }
  ) {
    const isValid = await this.service.verifyWooCommerceWebhook(
      body.payload,
      body.signature,
      body.consumerSecret
    );

    return {
      success: isValid,
      data: { provider: 'woocommerce', valid: isValid },
      message: isValid ? 'WooCommerce webhook valid' : 'WooCommerce webhook invalid',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify BigCommerce webhook
   * POST /webhook-signature/bigcommerce/verify
   */
  @Post('bigcommerce/verify')
  async verifyBigCommerceWebhook(
    @Body()
    body: {
      payload: string;
      signature: string;
      secret: string;
      headers?: Record<string, string>;
    }
  ) {
    const isValid = await this.service.verifyBigCommerceWebhook(
      body.payload,
      body.signature,
      body.secret,
      body.headers
    );

    return {
      success: isValid,
      data: { provider: 'bigcommerce', valid: isValid },
      message: isValid ? 'BigCommerce webhook valid' : 'BigCommerce webhook invalid',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify Stripe webhook
   * POST /webhook-signature/stripe/verify
   */
  @Post('stripe/verify')
  async verifyStripeWebhook(
    @Body()
    body: {
      payload: string;
      signature: string;
      secret: string;
    }
  ) {
    const isValid = await this.service.verifyStripeWebhook(
      body.payload,
      body.signature,
      body.secret
    );

    return {
      success: isValid,
      data: { provider: 'stripe', valid: isValid },
      message: isValid ? 'Stripe webhook valid' : 'Stripe webhook invalid',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate signature for webhook testing
   * POST /webhook-signature/generate
   */
  @Post('generate')
  async generateSignature(
    @Body()
    body: {
      payload: string;
      secret: string;
      algorithm?: 'sha256' | 'sha1';
      encoding?: 'hex' | 'base64';
    }
  ) {
    const signature = this.service.generateSignature(
      body.payload,
      body.secret,
      body.algorithm || 'sha256',
      body.encoding || 'hex'
    );

    return {
      success: true,
      data: {
        payload: body.payload,
        signature,
        algorithm: body.algorithm || 'sha256',
        encoding: body.encoding || 'hex',
      },
      message: 'Signature generated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get supported webhook providers
   * GET /webhook-signature/providers
   */
  @Get('providers')
  async getSupportedProviders() {
    const providers = this.service.getSupportedProviders();
    const providerConfigs = providers.map((provider) => ({
      name: provider,
      config: this.service.getProviderConfig(provider),
      signatureHeader: this.service.getSignatureHeaderName(provider),
    }));

    return {
      success: true,
      data: {
        providers: providerConfigs,
        count: providers.length,
      },
      message: 'Supported webhook providers',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get webhook verification statistics
   * GET /webhook-signature/stats
   */
  @Get('stats')
  async getStatistics() {
    const stats = await this.service.getStatistics();

    return {
      success: true,
      data: stats,
      message: 'Webhook signature verification statistics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get webhook signature header for provider
   * GET /webhook-signature/header/:provider
   */
  @Get('header/:provider')
  async getSignatureHeader(@Param('provider') provider: string) {
    const headerName = this.service.getSignatureHeaderName(provider);

    if (!headerName) {
      return {
        success: false,
        error: `Unknown provider: ${provider}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: {
        provider,
        headerName,
        config: this.service.getProviderConfig(provider),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
