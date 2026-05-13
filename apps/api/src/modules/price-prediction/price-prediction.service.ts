import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PricePredictionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Analyze historical price patterns for a product
   */
  async analyzePricePatterns(productId: string, days = 180) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!product || product.prices.length === 0) return null;

    const prices = product.prices.map((p) => p.price);
    const timestamps = product.prices.map((p) => p.timestamp);

    // Calculate basic statistics
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const current = prices[prices.length - 1];

    // Calculate moving averages
    const ma7 = this.calculateMovingAverage(prices, 7);
    const ma30 = this.calculateMovingAverage(prices, 30);

    // Detect trend
    const trend = current > avg ? 'upward' : current < avg ? 'downward' : 'stable';

    // Volatility
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = (stdDev / avg) * 100;

    // Identify peaks and troughs
    const peakTrough = this.identifyPeaksAndTroughs(prices, timestamps);

    return {
      productId,
      timeframe: `${days} days`,
      current: Math.round(current * 100) / 100,
      statistics: {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
      },
      movingAverages: {
        ma7: ma7 ? Math.round(ma7 * 100) / 100 : null,
        ma30: ma30 ? Math.round(ma30 * 100) / 100 : null,
      },
      trend,
      analysis: {
        priceDataPoints: prices.length,
        peakPrice: peakTrough.peak,
        peakDate: peakTrough.peakDate,
        troughPrice: peakTrough.trough,
        troughDate: peakTrough.troughDate,
        daysInData: Math.ceil((timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()) / (24 * 60 * 60 * 1000)),
      },
    };
  }

  /**
   * Predict future price based on historical trends
   */
  async predictFuturePrice(productId: string, daysAhead = 30) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          orderBy: { timestamp: 'asc' },
          take: 180, // Last 6 months
        },
      },
    });

    if (!product || product.prices.length < 7) return null;

    const prices = product.prices.map((p) => p.price);
    const current = prices[prices.length - 1];

    // Calculate exponential smoothing prediction
    const alpha = 0.3; // Smoothing factor
    const prediction = this.exponentialSmoothing(prices, alpha, daysAhead);

    // Calculate confidence based on data volume and volatility
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - (prices.reduce((s, pr) => s + pr, 0) / prices.length), 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const confidence = Math.min(100, (100 - (stdDev / avg) * 100 * 0.5));

    // Calculate price change
    const percentChange = ((prediction - current) / current) * 100;

    return {
      productId,
      current: Math.round(current * 100) / 100,
      prediction: Math.round(prediction * 100) / 100,
      daysAhead,
      expectedChange: {
        absolute: Math.round((prediction - current) * 100) / 100,
        percentage: Math.round(percentChange * 100) / 100,
      },
      confidence: Math.round(confidence * 100) / 100,
      recommendation: this.getRecommendation(percentChange, confidence),
      dataPoints: prices.length,
    };
  }

  /**
   * Identify seasonal patterns in pricing
   */
  async identifySeasonalPatterns(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        prices: {
          orderBy: { timestamp: 'asc' },
          take: 365, // Last year
        },
      },
    });

    if (!product || product.prices.length < 90) return null;

    // Group prices by month
    const byMonth = new Map<number, number[]>();
    product.prices.forEach((p) => {
      const month = new Date(p.timestamp).getMonth();
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month)!.push(p.price);
    });

    // Calculate average price per month
    const monthlyStats = Array.from(byMonth.entries())
      .map(([month, monthPrices]) => ({
        month: this.getMonthName(month),
        monthNumber: month + 1,
        avgPrice: Math.round((monthPrices.reduce((sum, p) => sum + p, 0) / monthPrices.length) * 100) / 100,
        minPrice: Math.round(Math.min(...monthPrices) * 100) / 100,
        maxPrice: Math.round(Math.max(...monthPrices) * 100) / 100,
        dataPoints: monthPrices.length,
      }))
      .sort((a, b) => a.monthNumber - b.monthNumber);

    const avgAll = monthlyStats.reduce((sum, m) => sum + m.avgPrice, 0) / monthlyStats.length;
    const bestMonth = monthlyStats.reduce((best, m) => m.avgPrice < best.avgPrice ? m : best);
    const worstMonth = monthlyStats.reduce((worst, m) => m.avgPrice > worst.avgPrice ? m : worst);

    return {
      productId,
      dataYears: Math.ceil(product.prices.length / 365),
      monthlyAnalysis: monthlyStats,
      insights: {
        bestTimeToBy: bestMonth.month,
        worstTimeToBuy: worstMonth.month,
        priceVariance: Math.round((worstMonth.avgPrice - bestMonth.avgPrice) * 100) / 100,
        percentVariance: Math.round(((worstMonth.avgPrice - bestMonth.avgPrice) / bestMonth.avgPrice) * 100 * 100) / 100,
        averagePrice: Math.round(avgAll * 100) / 100,
      },
    };
  }

  /**
   * Get best buy recommendation based on historical patterns
   */
  async getBestBuyRecommendation(productId: string) {
    const patterns = await this.analyzePricePatterns(productId, 180);
    const seasonal = await this.identifySeasonalPatterns(productId);
    const prediction = await this.predictFuturePrice(productId, 30);

    if (!patterns || !seasonal || !prediction) return null;

    const current = patterns.current;
    const min = patterns.statistics.min;
    const avg = patterns.statistics.avg;
    const pricePercentile = ((current - min) / (patterns.statistics.max - min)) * 100;

    // Determine action
    let action = 'wait';
    let urgency = 'low';

    if (pricePercentile < 25) {
      action = 'buy-now';
      urgency = 'high';
    } else if (pricePercentile < 50) {
      action = 'buy-soon';
      urgency = 'medium';
    } else if (prediction.expectedChange.percentage > 5) {
      action = 'wait';
      urgency = 'low';
    } else if (prediction.expectedChange.percentage < -5) {
      action = 'buy-soon';
      urgency = 'medium';
    }

    const currentMonth = new Date().getMonth() + 1;
    const bestMonth = seasonal.insights.bestTimeToBy;
    const bestMonthObj = seasonal.monthlyAnalysis.find((m: any) => m.month === bestMonth);
    const monthsToWait = bestMonthObj ? (12 - currentMonth + bestMonthObj.monthNumber) % 12 : 0;

    return {
      productId,
      current: current,
      currentPercentile: Math.round(pricePercentile * 100) / 100,
      action,
      urgency,
      reasoning: [
        `Current price is in the ${pricePercentile.toFixed(0)}th percentile`,
        `Historical low: $${min}, High: $${patterns.statistics.max}`,
        `Expected change in 30 days: ${prediction.expectedChange.percentage > 0 ? '+' : ''}${prediction.expectedChange.percentage}%`,
        `Best buying season: ${bestMonth} (${monthsToWait} months away)`,
      ],
      projection: {
        expectedPrice30Days: prediction.prediction,
        expectedChange: prediction.expectedChange.absolute,
        confidence: prediction.confidence,
      },
      savings: {
        currentVsLowest: Math.round((current - min) * 100) / 100,
        savingsPercent: Math.round(((current - min) / current) * 100 * 100) / 100,
        currentVsAverage: Math.round((current - avg) * 100) / 100,
      },
    };
  }

  // Helper methods
  private calculateMovingAverage(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const relevantPrices = prices.slice(-period);
    return relevantPrices.reduce((sum, p) => sum + p, 0) / relevantPrices.length;
  }

  private exponentialSmoothing(prices: number[], alpha: number, stepsAhead: number): number {
    let smoothed = prices[0];
    for (let i = 1; i < prices.length; i++) {
      smoothed = alpha * prices[i] + (1 - alpha) * smoothed;
    }
    // Simple projection (assumes smoothed value continues)
    return smoothed;
  }

  private identifyPeaksAndTroughs(prices: number[], timestamps: Date[]) {
    const peaks: Array<{ price: number; date: Date }> = [];
    const troughs: Array<{ price: number; date: Date }> = [];

    for (let i = 1; i < prices.length - 1; i++) {
      if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
        peaks.push({ price: prices[i], date: timestamps[i] });
      }
      if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
        troughs.push({ price: prices[i], date: timestamps[i] });
      }
    }

    const highestPeak = peaks.length > 0 ? peaks.reduce((max, p) => p.price > max.price ? p : max) : null;
    const lowestTrough = troughs.length > 0 ? troughs.reduce((min, p) => p.price < min.price ? p : min) : null;

    return {
      peak: highestPeak ? Math.round(highestPeak.price * 100) / 100 : null,
      peakDate: highestPeak?.date,
      trough: lowestTrough ? Math.round(lowestTrough.price * 100) / 100 : null,
      troughDate: lowestTrough?.date,
    };
  }

  private getRecommendation(percentChange: number, confidence: number): string {
    if (confidence < 50) return 'insufficient-data';
    if (percentChange > 10) return 'price-increasing-wait';
    if (percentChange < -10) return 'price-decreasing-buy';
    return 'price-stable-neutral';
  }

  private getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
