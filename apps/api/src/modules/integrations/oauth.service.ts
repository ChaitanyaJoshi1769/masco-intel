import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export type OAuthProvider = 'google' | 'microsoft' | 'facebook' | 'shopify';

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  scope: string[];
}

export interface OAuthState {
  state: string;
  codeChallenge: string;
  provider: OAuthProvider;
  integrationId: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private oauthConfigs: Map<string, OAuthConfig> = new Map();
  private oauthStates: Map<string, OAuthState> = new Map();
  private oauthTokens: Map<string, OAuthToken> = new Map();

  constructor() {
    this.initializeSampleConfigs();
  }

  /**
   * Initialize sample OAuth configurations
   */
  private initializeSampleConfigs(): void {
    const sampleConfigs: OAuthConfig[] = [
      {
        provider: 'google',
        clientId: 'google_client_id_demo_12345.apps.googleusercontent.com',
        clientSecret: 'google_client_secret_demo_abc123',
        redirectUri: 'https://api.masco-intel.com/oauth/callback/google',
        scopes: ['email', 'profile', 'openid'],
      },
      {
        provider: 'microsoft',
        clientId: 'microsoft_client_id_demo_12345',
        clientSecret: 'microsoft_client_secret_demo_abc123',
        redirectUri: 'https://api.masco-intel.com/oauth/callback/microsoft',
        scopes: ['user.read', 'email'],
      },
      {
        provider: 'facebook',
        clientId: 'facebook_app_id_demo_12345',
        clientSecret: 'facebook_app_secret_demo_abc123',
        redirectUri: 'https://api.masco-intel.com/oauth/callback/facebook',
        scopes: ['email', 'public_profile'],
      },
      {
        provider: 'shopify',
        clientId: 'shopify_app_demo_12345',
        clientSecret: 'shopify_app_secret_demo_abc123',
        redirectUri: 'https://api.masco-intel.com/oauth/callback/shopify',
        scopes: ['read_products', 'write_products', 'read_inventory'],
      },
    ];

    for (const config of sampleConfigs) {
      this.oauthConfigs.set(config.provider, config);
    }
  }

  /**
   * Get OAuth configuration for provider
   */
  async getOAuthConfig(provider: OAuthProvider): Promise<OAuthConfig | null> {
    try {
      return this.oauthConfigs.get(provider) || null;
    } catch (error) {
      this.logger.error(`Failed to get OAuth config: ${error}`);
      throw error;
    }
  }

  /**
   * Generate authorization URL
   */
  async generateAuthorizationUrl(
    provider: OAuthProvider,
    integrationId: string,
    state?: string
  ): Promise<{
    authorizationUrl: string;
    state: string;
    codeChallenge: string;
  }> {
    try {
      const config = this.oauthConfigs.get(provider);
      if (!config) {
        throw new Error(`OAuth provider not configured: ${provider}`);
      }

      // Generate state for CSRF protection
      const generatedState = state || this.generateRandomState();
      const codeChallenge = this.generateCodeChallenge();

      // Store state for validation
      const oauthState: OAuthState = {
        state: generatedState,
        codeChallenge,
        provider,
        integrationId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false,
      };

      this.oauthStates.set(generatedState, oauthState);

      const authorizationUrl = this.buildAuthorizationUrl(provider, config, generatedState, codeChallenge);

      this.logger.log(`Authorization URL generated for ${provider}`);
      return {
        authorizationUrl,
        state: generatedState,
        codeChallenge,
      };
    } catch (error) {
      this.logger.error(`Failed to generate authorization URL: ${error}`);
      throw error;
    }
  }

  /**
   * Exchange authorization code for token
   */
  async exchangeCodeForToken(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<OAuthToken | null> {
    try {
      // Validate state
      const oauthState = this.oauthStates.get(state);
      if (!oauthState || oauthState.provider !== provider) {
        this.logger.warn(`Invalid or mismatched OAuth state: ${state}`);
        return null;
      }

      if (oauthState.expiresAt < new Date()) {
        this.logger.warn(`OAuth state expired: ${state}`);
        return null;
      }

      if (oauthState.used) {
        this.logger.warn(`OAuth state already used: ${state}`);
        return null;
      }

      // Mark state as used
      oauthState.used = true;
      this.oauthStates.set(state, oauthState);

      // Simulate token exchange (in production, make actual API call)
      const token = this.simulateTokenExchange(provider, code);

      if (token) {
        const tokenId = `token_${provider}_${Date.now()}`;
        this.oauthTokens.set(tokenId, token);
        this.logger.log(`Token obtained for ${provider}`);
      }

      return token;
    } catch (error) {
      this.logger.error(`Failed to exchange code for token: ${error}`);
      throw error;
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(tokenId: string): Promise<OAuthToken | null> {
    try {
      const token = this.oauthTokens.get(tokenId);
      if (!token || !token.refreshToken) {
        return null;
      }

      // Simulate refresh (in production, make actual API call)
      const newToken: OAuthToken = {
        ...token,
        accessToken: this.generateRandomState(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      };

      this.oauthTokens.set(tokenId, newToken);
      this.logger.log(`Token refreshed: ${tokenId}`);
      return newToken;
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${error}`);
      throw error;
    }
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(tokenId: string, provider: OAuthProvider): Promise<boolean> {
    try {
      const deleted = this.oauthTokens.delete(tokenId);
      if (deleted) {
        this.logger.log(`Token revoked: ${tokenId} (${provider})`);
      }
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to revoke token: ${error}`);
      throw error;
    }
  }

  /**
   * Get token information (masked)
   */
  async getTokenInfo(tokenId: string): Promise<Omit<OAuthToken, 'accessToken' | 'refreshToken'> | null> {
    try {
      const token = this.oauthTokens.get(tokenId);
      if (!token) return null;

      return {
        tokenType: token.tokenType,
        expiresIn: token.expiresIn,
        expiresAt: token.expiresAt,
        scope: token.scope,
      };
    } catch (error) {
      this.logger.error(`Failed to get token info: ${error}`);
      throw error;
    }
  }

  /**
   * Build authorization URL for provider
   */
  private buildAuthorizationUrl(
    provider: OAuthProvider,
    config: OAuthConfig,
    state: string,
    codeChallenge: string
  ): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const baseUrls: Record<OAuthProvider, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      facebook: 'https://www.facebook.com/v18.0/dialog/oauth',
      shopify: 'https://[store-name].myshopify.com/admin/oauth/authorize',
    };

    return `${baseUrls[provider]}?${params.toString()}`;
  }

  /**
   * Simulate token exchange
   */
  private simulateTokenExchange(provider: OAuthProvider, code: string): OAuthToken {
    return {
      accessToken: this.generateRandomState(),
      refreshToken: this.generateRandomState(),
      tokenType: 'Bearer',
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      scope: this.getDefaultScopes(provider),
    };
  }

  /**
   * Generate random state string
   */
  private generateRandomState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate code challenge for PKCE
   */
  private generateCodeChallenge(): string {
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Get default scopes for provider
   */
  private getDefaultScopes(provider: OAuthProvider): string[] {
    const scopeMap: Record<OAuthProvider, string[]> = {
      google: ['email', 'profile', 'openid'],
      microsoft: ['user.read', 'email'],
      facebook: ['email', 'public_profile'],
      shopify: ['read_products', 'write_products', 'read_inventory'],
    };

    return scopeMap[provider] || [];
  }

  /**
   * Get OAuth statistics
   */
  async getOAuthStats(): Promise<{
    configuredProviders: number;
    activeTokens: number;
    expiredTokens: number;
    pendingAuthorizations: number;
    usedStates: number;
  }> {
    try {
      const activeTokens = Array.from(this.oauthTokens.values()).filter(
        (t) => t.expiresAt > new Date()
      ).length;

      const expiredTokens = Array.from(this.oauthTokens.values()).filter(
        (t) => t.expiresAt <= new Date()
      ).length;

      const pendingAuthorizations = Array.from(this.oauthStates.values()).filter(
        (s) => !s.used && s.expiresAt > new Date()
      ).length;

      const usedStates = Array.from(this.oauthStates.values()).filter((s) => s.used).length;

      return {
        configuredProviders: this.oauthConfigs.size,
        activeTokens,
        expiredTokens,
        pendingAuthorizations,
        usedStates,
      };
    } catch (error) {
      this.logger.error(`Failed to get OAuth stats: ${error}`);
      throw error;
    }
  }
}
