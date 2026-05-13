import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface WebhookSignatureConfig {
  algorithm: 'sha256' | 'sha1';
  encoding: 'hex' | 'base64';
  headerName: string;
  timestampHeaderName?: string;
  replayProtectionWindow?: number; // in seconds
}

export interface WebhookSignatureVerificationResult {
  valid: boolean;
  provider: string;
  timestamp?: Date;
  reason?: string;
}

@Injectable()
export class WebhookSignatureService {
  private readonly logger = new Logger(WebhookSignatureService.name);

  // Provider-specific signature configurations
  private signatureConfigs: Map<string, WebhookSignatureConfig> = new Map([
    [
      'shopify',
      {
        algorithm: 'sha256',
        encoding: 'base64',
        headerName: 'X-Shopify-Hmac-SHA256',
        timestampHeaderName: 'X-Shopify-Webhook-Id',
        replayProtectionWindow: 300, // 5 minutes
      },
    ],
    [
      'woocommerce',
      {
        algorithm: 'sha256',
        encoding: 'hex',
        headerName: 'X-WC-Webhook-Signature',
        replayProtectionWindow: 300,
      },
    ],
    [
      'bigcommerce',
      {
        algorithm: 'sha256',
        encoding: 'hex',
        headerName: 'X-Custom-Hmac-SHA256',
        timestampHeaderName: 'X-Timestamp',
        replayProtectionWindow: 300,
      },
    ],
    [
      'stripe',
      {
        algorithm: 'sha256',
        encoding: 'hex',
        headerName: 'Stripe-Signature',
        replayProtectionWindow: 300,
      },
    ],
  ]);

  // Cache processed webhook IDs to prevent replay attacks
  private processedWebhooks: Map<string, Date> = new Map();

  constructor() {
    // Cleanup old webhook entries every minute
    setInterval(() => this.cleanupProcessedWebhooks(), 60 * 1000);
  }

  /**
   * Verify webhook signature for provider
   */
  async verifySignature(
    provider: string,
    payload: string | Buffer,
    signature: string,
    secret: string,
    additionalHeaders?: Record<string, string>
  ): Promise<WebhookSignatureVerificationResult> {
    try {
      const config = this.signatureConfigs.get(provider);
      if (!config) {
        return {
          valid: false,
          provider,
          reason: `Unknown provider: ${provider}`,
        };
      }

      // Verify basic signature
      const expectedSignature = this.generateSignature(
        payload,
        secret,
        config.algorithm,
        config.encoding
      );

      if (signature !== expectedSignature) {
        this.logger.warn(
          `Invalid webhook signature for ${provider}: signature mismatch`
        );
        return {
          valid: false,
          provider,
          reason: 'Signature mismatch',
        };
      }

      // Check timestamp for replay protection
      if (config.timestampHeaderName && additionalHeaders) {
        const timestamp = additionalHeaders[config.timestampHeaderName];
        const verification = this.verifyTimestamp(
          timestamp,
          config.replayProtectionWindow
        );

        if (!verification.valid) {
          this.logger.warn(
            `Invalid timestamp for ${provider}: ${verification.reason}`
          );
          return {
            valid: false,
            provider,
            reason: verification.reason,
            timestamp: verification.timestamp,
          };
        }
      }

      // Check for replay attacks using webhook ID
      if (additionalHeaders?.['X-Webhook-Id']) {
        const webhookId = additionalHeaders['X-Webhook-Id'];
        if (this.processedWebhooks.has(webhookId)) {
          this.logger.warn(`Replay attack detected for webhook: ${webhookId}`);
          return {
            valid: false,
            provider,
            reason: 'Webhook already processed (replay attack)',
          };
        }
        // Mark as processed
        this.processedWebhooks.set(webhookId, new Date());
      }

      this.logger.log(`Valid webhook signature for ${provider}`);
      return {
        valid: true,
        provider,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to verify webhook signature: ${error}`);
      return {
        valid: false,
        provider,
        reason: `Verification error: ${error}`,
      };
    }
  }

  /**
   * Generate signature for webhook
   */
  generateSignature(
    payload: string | Buffer,
    secret: string,
    algorithm: 'sha256' | 'sha1' = 'sha256',
    encoding: 'hex' | 'base64' = 'hex'
  ): string {
    try {
      const payloadString =
        typeof payload === 'string' ? payload : payload.toString();

      const hmac = crypto.createHmac(algorithm, secret);
      hmac.update(payloadString);

      return hmac.digest(encoding);
    } catch (error) {
      this.logger.error(`Failed to generate signature: ${error}`);
      throw error;
    }
  }

  /**
   * Verify timestamp for replay protection
   */
  private verifyTimestamp(
    timestamp: string | undefined,
    windowSeconds: number = 300
  ): {
    valid: boolean;
    reason?: string;
    timestamp?: Date;
  } {
    if (!timestamp) {
      return {
        valid: true, // Skip if not provided
      };
    }

    try {
      // Try parsing as Unix timestamp (seconds)
      let timestampMs: number;
      if (!isNaN(Number(timestamp))) {
        timestampMs = Number(timestamp) * 1000;
      } else {
        // Try ISO format
        timestampMs = new Date(timestamp).getTime();
      }

      const now = Date.now();
      const diff = Math.abs(now - timestampMs) / 1000; // Convert to seconds

      if (diff > windowSeconds) {
        return {
          valid: false,
          reason: `Timestamp outside replay protection window (${diff}s > ${windowSeconds}s)`,
          timestamp: new Date(timestampMs),
        };
      }

      return {
        valid: true,
        timestamp: new Date(timestampMs),
      };
    } catch (error) {
      return {
        valid: false,
        reason: `Failed to parse timestamp: ${error}`,
      };
    }
  }

  /**
   * Verify Shopify webhook signature (provider-specific)
   */
  async verifyShopifyWebhook(
    payload: string | Buffer,
    signature: string,
    apiSecret: string
  ): Promise<boolean> {
    try {
      const result = await this.verifySignature(
        'shopify',
        payload,
        signature,
        apiSecret
      );
      return result.valid;
    } catch (error) {
      this.logger.error(`Shopify webhook verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Verify WooCommerce webhook signature (provider-specific)
   */
  async verifyWooCommerceWebhook(
    payload: string | Buffer,
    signature: string,
    consumerSecret: string
  ): Promise<boolean> {
    try {
      const result = await this.verifySignature(
        'woocommerce',
        payload,
        signature,
        consumerSecret
      );
      return result.valid;
    } catch (error) {
      this.logger.error(`WooCommerce webhook verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Verify BigCommerce webhook signature (provider-specific)
   */
  async verifyBigCommerceWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string,
    additionalHeaders?: Record<string, string>
  ): Promise<boolean> {
    try {
      const result = await this.verifySignature(
        'bigcommerce',
        payload,
        signature,
        secret,
        additionalHeaders
      );
      return result.valid;
    } catch (error) {
      this.logger.error(`BigCommerce webhook verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Verify Stripe webhook signature (provider-specific)
   */
  async verifyStripeWebhook(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      // Stripe uses a special format: timestamp.signature
      const [timestamp, hash] = signature.split(',').map((s) => {
        const [key, value] = s.split('=');
        return value;
      });

      if (!timestamp || !hash) {
        this.logger.warn('Invalid Stripe signature format');
        return false;
      }

      // Verify timestamp
      const timestampVerification = this.verifyTimestamp(
        timestamp,
        300
      );
      if (!timestampVerification.valid) {
        return false;
      }

      // Verify signature
      const signedContent = `${timestamp}.${payload}`;
      const expectedHash = this.generateSignature(
        signedContent,
        secret,
        'sha256',
        'hex'
      );

      return hash === expectedHash;
    } catch (error) {
      this.logger.error(`Stripe webhook verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Get webhook signature header name for provider
   */
  getSignatureHeaderName(provider: string): string | undefined {
    return this.signatureConfigs.get(provider)?.headerName;
  }

  /**
   * List all supported webhook providers
   */
  getSupportedProviders(): string[] {
    return Array.from(this.signatureConfigs.keys());
  }

  /**
   * Get configuration for webhook provider
   */
  getProviderConfig(provider: string): WebhookSignatureConfig | undefined {
    return this.signatureConfigs.get(provider);
  }

  /**
   * Cleanup old processed webhook entries
   */
  private cleanupProcessedWebhooks(): void {
    try {
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const [webhookId, timestamp] of this.processedWebhooks.entries()) {
        if (now - timestamp.getTime() > maxAge) {
          this.processedWebhooks.delete(webhookId);
        }
      }

      const remainingCount = this.processedWebhooks.size;
      if (remainingCount > 10000) {
        this.logger.warn(
          `Large number of processed webhooks in memory: ${remainingCount}`
        );
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup processed webhooks: ${error}`);
    }
  }

  /**
   * Get webhook verification statistics
   */
  async getStatistics(): Promise<{
    supportedProviders: number;
    processedWebhooks: number;
    providers: string[];
  }> {
    return {
      supportedProviders: this.signatureConfigs.size,
      processedWebhooks: this.processedWebhooks.size,
      providers: this.getSupportedProviders(),
    };
  }
}
