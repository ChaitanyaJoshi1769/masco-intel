import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface DemandPrediction {
  productId: string;
  currentPrice: number;
  pricePoints: Array<{
    price: number;
    estimatedDemandLevel: 'low' | 'medium' | 'high';
    estimatedConversionRate: number;
    estimatedRevenue: number;
  }>;
  recommendedPrice: number;
  recommendedReason: string;
  confidenceScore: number;
}

export interface MarginAnalysis {
  productId: string;
  currentPrice: number;
  estimatedCost: number;
  currentMargin: number;
  currentMarginPercent: number;
  optimalPricePoints: Array<{
    price: number;
    margin: number;
    marginPercent: number;
    estimatedSalesVolume: number;
    netRevenue: number;
  }>;
  recommendedPrice: number;
  recommendedMargin: number;
  recommendedMarginPercent: number;
  profitIncrease: number;
  profitIncreasePercent: number;
}

export interface PriceOptimizationRecommendation {
  productId: string;
  productTitle: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  demandImpact: string;
  profitImpact: number;
  profitImpactPercent: number;
  confidenceScore: number;
  recommendation: string;
}

@Injectable()
export class PriceOptimizationService {
  private prisma: PrismaClient;
  private readonly logger = new Logger(PriceOptimizationService.name);

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Predict demand at various price points using historical data
   */
  async predictDemand(productId: string): Promise<DemandPrediction> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          prices: {
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
        },
      });

      if (!product || product.prices.length === 0) {
        throw new Error('Insufficient price history data');
      }

      const currentPrice = product.prices[0]?.price || 0;

      // Calculate price elasticity from historical data
      const priceHistory = product.prices.map((p: any) => p.price).reverse();
      const elasticity = this.calculatePriceElasticity(priceHistory);

      // Generate price points and demand predictions
      const pricePoints = [];
      const basePrice = currentPrice;
      const priceRange = basePrice * 0.5; // ±50% range

      for (let i = 0.5; i <= 1.5; i += 0.1) {
        const price = Math.round(basePrice * i * 100) / 100;
        const priceChange = (i - 1) * 100; // percentage change

        // Use elasticity to estimate demand change
        // Demand change = -elasticity * price change %
        const demandChange = -elasticity * priceChange;
        const baselineDemandLevel = 100; // arbitrary baseline
        const estimatedDemand = baselineDemandLevel * (1 + demandChange / 100);

        // Determine demand level
        let demandLevel: 'low' | 'medium' | 'high' = 'medium';
        if (estimatedDemand < 40) demandLevel = 'low';
        if (estimatedDemand > 120) demandLevel = 'high';

        // Estimate conversion rate (0.1-0.9)
        const conversionRate = Math.max(0.1, Math.min(0.9, 0.5 + demandChange / 500));

        // Estimate revenue
        const estimatedRevenue = price * estimatedDemand * conversionRate;

        pricePoints.push({
          price,
          estimatedDemandLevel: demandLevel,
          estimatedConversionRate: Math.round(conversionRate * 1000) / 1000,
          estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
        });
      }

      // Find optimal price (highest revenue)
      const optimalPoint = pricePoints.reduce((max, point) =>
        point.estimatedRevenue > max.estimatedRevenue ? point : max
      );

      return {
        productId,
        currentPrice,
        pricePoints,
        recommendedPrice: optimalPoint.price,
        recommendedReason: `Optimal price point for maximum revenue at estimated ${optimalPoint.estimatedDemandLevel} demand level`,
        confidenceScore: Math.min(0.95, 0.7 + product.prices.length * 0.01),
      };
    } catch (error) {
      this.logger.error(`Demand prediction failed: ${error}`);
      throw error;
    }
  }

  /**
   * Analyze margins and recommend optimal pricing
   */
  async analyzeMargins(productId: string, estimatedCost?: number): Promise<MarginAnalysis> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          prices: {
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
        },
      });

      if (!product || product.prices.length === 0) {
        throw new Error('Insufficient price history data');
      }

      const currentPrice = product.prices[0].price;

      // Estimate cost if not provided (use lowest price as proxy with 20% margin)
      const minHistoricalPrice = Math.min(...product.prices.map((p: any) => p.price));
      const estimatedProductCost = estimatedCost || minHistoricalPrice * 0.8;

      const currentMargin = currentPrice - estimatedProductCost;
      const currentMarginPercent = (currentMargin / currentPrice) * 100;

      // Generate optimal price points with margin analysis
      const optimalPricePoints = [];
      const basePrice = currentPrice;

      // Test different price points
      for (let i = 0.6; i <= 1.6; i += 0.1) {
        const price = Math.round(basePrice * i * 100) / 100;
        const margin = price - estimatedProductCost;
        const marginPercent = (margin / price) * 100;

        // Estimate sales volume based on price elasticity
        const elasticity = this.calculatePriceElasticity(product.prices.map((p: any) => p.price).reverse());
        const priceChangePercent = ((price - currentPrice) / currentPrice) * 100;
        const volumeChangePercent = -elasticity * priceChangePercent;
        const baselineVolume = 100;
        const estimatedVolume = baselineVolume * (1 + volumeChangePercent / 100);
        const netRevenue = price * estimatedVolume * margin;

        optimalPricePoints.push({
          price,
          margin: Math.round(margin * 100) / 100,
          marginPercent: Math.round(marginPercent * 100) / 100,
          estimatedSalesVolume: Math.round(estimatedVolume * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100,
        });
      }

      // Find optimal point (highest net revenue)
      const optimal = optimalPricePoints.reduce((max, point) =>
        point.netRevenue > max.netRevenue ? point : max
      );

      const profitIncrease = optimal.margin * (optimal.estimatedSalesVolume / 100);
      const currentProfit = currentMargin * 100; // baseline 100 units
      const profitIncreasePercent = currentProfit > 0 ? ((profitIncrease - currentProfit) / currentProfit) * 100 : 0;

      return {
        productId,
        currentPrice,
        estimatedCost: Math.round(estimatedProductCost * 100) / 100,
        currentMargin: Math.round(currentMargin * 100) / 100,
        currentMarginPercent: Math.round(currentMarginPercent * 100) / 100,
        optimalPricePoints,
        recommendedPrice: optimal.price,
        recommendedMargin: Math.round(optimal.margin * 100) / 100,
        recommendedMarginPercent: Math.round(optimal.marginPercent * 100) / 100,
        profitIncrease: Math.round(profitIncrease * 100) / 100,
        profitIncreasePercent: Math.round(profitIncreasePercent * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Margin analysis failed: ${error}`);
      throw error;
    }
  }

  /**
   * Get comprehensive price optimization recommendations
   */
  async getOptimizationRecommendations(productIds?: string[]): Promise<PriceOptimizationRecommendation[]> {
    try {
      let products;

      if (productIds && productIds.length > 0) {
        products = await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { prices: { orderBy: { timestamp: 'desc' }, take: 20 } },
        });
      } else {
        // Get top products with good price history
        products = await this.prisma.product.findMany({
          take: 20,
          include: { prices: { orderBy: { timestamp: 'desc' }, take: 20 } },
        });
      }

      const recommendations: PriceOptimizationRecommendation[] = [];

      for (const product of products) {
        if (product.prices.length < 5) continue; // Skip products with insufficient history

        try {
          const demand = await this.predictDemand(product.id);
          const margins = await this.analyzeMargins(product.id);

          const currentPrice = product.prices[0]?.price || 0;
          const recommendedPrice = (demand.recommendedPrice + margins.recommendedPrice) / 2;
          const priceChange = recommendedPrice - currentPrice;
          const priceChangePercent = (priceChange / currentPrice) * 100;

          // Determine confidence and recommendation
          const avgConfidence = (demand.confidenceScore + Math.min(0.95, 0.8 + product.prices.length * 0.01)) / 2;

          let recommendation = 'HOLD';
          let demandImpact = 'neutral';

          if (Math.abs(priceChangePercent) > 5) {
            if (priceChangePercent > 5) {
              recommendation = 'INCREASE';
              demandImpact = 'High demand justifies price increase';
            } else {
              recommendation = 'DECREASE';
              demandImpact = 'Price reduction will increase volume';
            }
          }

          const profitImpact = margins.profitIncrease;
          const profitImpactPercent = margins.profitIncreasePercent;

          recommendations.push({
            productId: product.id,
            productTitle: product.title,
            currentPrice,
            recommendedPrice: Math.round(recommendedPrice * 100) / 100,
            priceChange: Math.round(priceChange * 100) / 100,
            priceChangePercent: Math.round(priceChangePercent * 100) / 100,
            demandImpact,
            profitImpact: Math.round(profitImpact * 100) / 100,
            profitImpactPercent: Math.round(profitImpactPercent * 100) / 100,
            confidenceScore: Math.round(avgConfidence * 1000) / 1000,
            recommendation,
          });
        } catch (productError) {
          this.logger.warn(`Skipping product ${product.id}: ${productError}`);
        }
      }

      return recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
    } catch (error) {
      this.logger.error(`Optimization recommendations failed: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate price elasticity from historical price data
   */
  private calculatePriceElasticity(prices: number[]): number {
    if (prices.length < 2) return 1; // default elasticity

    // Calculate percentage changes
    const changes = [];
    for (let i = 1; i < Math.min(prices.length, 10); i++) {
      const priceChange = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
      changes.push(Math.abs(priceChange));
    }

    if (changes.length === 0) return 1;

    // Average change indicates elasticity (inverse relationship)
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

    // Higher volatility = higher elasticity (1.2-0.5 range)
    if (avgChange < 2) return 0.5; // inelastic
    if (avgChange < 5) return 0.8; // moderately inelastic
    if (avgChange < 10) return 1.2; // moderately elastic
    return 1.5; // elastic
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
