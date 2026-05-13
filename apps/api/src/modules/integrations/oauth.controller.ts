import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { OAuthService } from './oauth.service';

export type OAuthProvider = 'google' | 'microsoft' | 'facebook' | 'shopify';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * Generate OAuth authorization URL for provider
   * GET /oauth/:provider/authorize?integrationId=shopify-demo
   */
  @Get(':provider/authorize')
  async generateAuthorizationUrl(
    @Param('provider') provider: OAuthProvider,
    @Query('integrationId') integrationId: string
  ) {
    const result = await this.oauthService.generateAuthorizationUrl(
      provider,
      integrationId
    );

    return {
      success: true,
      data: result,
      message: `Authorization URL generated for ${provider}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle OAuth callback and exchange code for token
   * POST /oauth/callback/:provider
   * Body: { code: string, state: string }
   */
  @Post('callback/:provider')
  async handleCallback(
    @Param('provider') provider: OAuthProvider,
    @Body() body: { code: string; state: string }
  ) {
    const token = await this.oauthService.exchangeCodeForToken(
      provider,
      body.code,
      body.state
    );

    if (!token) {
      return {
        success: false,
        error: 'Failed to exchange code for token. State validation failed or expired.',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: token,
      message: `Successfully authenticated with ${provider}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get OAuth configuration for provider
   * GET /oauth/:provider/config
   */
  @Get(':provider/config')
  async getOAuthConfig(@Param('provider') provider: OAuthProvider) {
    const config = await this.oauthService.getOAuthConfig(provider);

    if (!config) {
      return {
        success: false,
        error: `OAuth provider not configured: ${provider}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: {
        provider: config.provider,
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
      },
      message: `Configuration for ${provider}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Refresh OAuth token
   * POST /oauth/tokens/:tokenId/refresh
   */
  @Post('tokens/:tokenId/refresh')
  async refreshToken(@Param('tokenId') tokenId: string) {
    const newToken = await this.oauthService.refreshToken(tokenId);

    if (!newToken) {
      return {
        success: false,
        error: 'Token not found or refresh token not available',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: newToken,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Revoke OAuth token
   * DELETE /oauth/tokens/:tokenId
   */
  @Delete('tokens/:tokenId')
  async revokeToken(@Param('tokenId') tokenId: string) {
    const revoked = await this.oauthService.revokeToken(
      tokenId,
      'unknown' as OAuthProvider
    );

    return {
      success: revoked,
      message: revoked ? 'Token revoked successfully' : 'Token not found',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get token information (masked)
   * GET /oauth/tokens/:tokenId
   */
  @Get('tokens/:tokenId')
  async getTokenInfo(@Param('tokenId') tokenId: string) {
    const tokenInfo = await this.oauthService.getTokenInfo(tokenId);

    if (!tokenInfo) {
      return {
        success: false,
        error: 'Token not found',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      data: tokenInfo,
      message: 'Token information (sensitive fields masked)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get OAuth statistics
   * GET /oauth/stats
   */
  @Get('stats')
  async getOAuthStats() {
    const stats = await this.oauthService.getOAuthStats();

    return {
      success: true,
      data: stats,
      message: 'OAuth system statistics',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Supported OAuth providers
   * GET /oauth/providers
   */
  @Get()
  async getProviders() {
    return {
      success: true,
      data: {
        providers: ['google', 'microsoft', 'facebook', 'shopify'],
        description: 'Supported OAuth providers for integration',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
