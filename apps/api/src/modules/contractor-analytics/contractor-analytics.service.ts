import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ContractorAnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate return on investment (ROI) for a product
   * Considers purchase price, repair costs over lifespan, and labor costs
   */
  async calculateROI(productId: string, timeframeYears = 10, laborCostPerHour = 50) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        contractorIntelligence: true,
        qualityAnalysis: true,
      },
    });

    if (!product) return null;

    const purchasePrice = product.prices[0]?.price || 0;
    const intel = product.contractorIntelligence;
    const quality = product.qualityAnalysis;

    if (!intel) {
      return {
        productId,
        error: 'No contractor intelligence data available',
      };
    }

    // Calculate costs
    const failureRate = intel.failureRate || 0.05;
    const repairCost = intel.repairCost || 0;
    const installTime = intel.installTimeMinutes || 0;
    const longevity = intel.longevity || 10;

    // Total repair costs over timeframe
    const expectedFailures = Math.floor((timeframeYears / longevity) * failureRate * 100);
    const totalRepairCosts = expectedFailures * repairCost;

    // Installation labor cost
    const installLaborCost = (installTime / 60) * laborCostPerHour;

    // Total cost of ownership
    const tco = purchasePrice + installLaborCost + totalRepairCosts;

    // Cost per year of use
    const costPerYear = tco / timeframeYears;

    // Warranty value
    const warrantyYears = quality?.warrantyYears || 1;
    const warrantyValue = warrantyYears * (repairCost * 0.25); // Assume warranty covers 25% of repair

    // Net ROI
    const netROI = ((warrantyValue - tco) / tco) * 100;

    return {
      productId,
      productTitle: product.title,
      brand: product.brand?.name,
      timeframeYears,
      costs: {
        purchasePrice: Math.round(purchasePrice * 100) / 100,
        installationLabor: Math.round(installLaborCost * 100) / 100,
        estimatedRepairCosts: Math.round(totalRepairCosts * 100) / 100,
        totalCostOfOwnership: Math.round(tco * 100) / 100,
        costPerYear: Math.round(costPerYear * 100) / 100,
      },
      reliability: {
        failureRate: failureRate,
        expectedFailuresOver10Years: expectedFailures,
        repairCostPerFailure: repairCost,
        warrantyYears,
        warrantyValue: Math.round(warrantyValue * 100) / 100,
      },
      roi: {
        netROI: Math.round(netROI * 100) / 100,
        recommendation: netROI > 0 ? 'excellent-value' : netROI > -50 ? 'good-value' : 'consider-alternative',
      },
    };
  }

  /**
   * Calculate total cost of ownership for a product
   */
  async calculateTCO(productId: string, timeframeYears = 10) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        contractorIntelligence: true,
      },
    });

    if (!product) return null;

    const intel = product.contractorIntelligence;
    if (!intel) return null;

    const purchasePrice = product.prices[0]?.price || 0;
    const failureRate = intel.failureRate || 0.05;
    const repairCost = intel.repairCost || 0;
    const longevity = intel.longevity || 10;

    // Maintenance costs (assume minimal if no data)
    const maintenanceCostPerYear = (repairCost * failureRate) / longevity;
    const totalMaintenanceCosts = maintenanceCostPerYear * timeframeYears;

    // Total TCO
    const tco = purchasePrice + totalMaintenanceCosts;

    return {
      productId,
      productTitle: product.title,
      brand: product.brand?.name,
      timeframeYears,
      breakdown: {
        purchasePrice: Math.round(purchasePrice * 100) / 100,
        maintenanceCosts: Math.round(totalMaintenanceCosts * 100) / 100,
        totalTCO: Math.round(tco * 100) / 100,
        costPerYear: Math.round((tco / timeframeYears) * 100) / 100,
        costPerMonth: Math.round((tco / (timeframeYears * 12)) * 100) / 100,
      },
      longevityEstimate: `${longevity} years`,
    };
  }

  /**
   * Compare ROI for multiple products
   */
  async compareROI(productIds: string[], timeframeYears = 10) {
    const rois = await Promise.all(productIds.map((id) => this.calculateROI(id, timeframeYears)));

    const validROIs = rois.filter((r) => r && !('error' in r)) as Array<{
      productId: string;
      productTitle: string;
      brand: string;
      costs: { totalCostOfOwnership: number };
      roi: { netROI: number; recommendation: string };
    }>;

    return {
      productCount: validROIs.length,
      timeframeYears,
      comparison: validROIs
        .sort((a, b) => b.roi.netROI - a.roi.netROI)
        .map((r) => ({
          rank: 0,
          productTitle: r.productTitle,
          brand: r.brand,
          totalCost: r.costs.totalCostOfOwnership,
          roi: r.roi.netROI,
          recommendation: r.roi.recommendation,
        }))
        .map((item, idx) => ({ ...item, rank: idx + 1 })),
      bestValue: validROIs.length > 0 ? validROIs[0] : null,
    };
  }

  /**
   * Estimate total job cost for material and labor
   */
  async estimateJobCost(
    productIds: string[],
    quantities: number[],
    laborCostPerHour: number,
  ) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        prices: { orderBy: { timestamp: 'desc' }, take: 1 },
        contractorIntelligence: true,
      },
    });

    const itemCosts = products.map((p, idx) => {
      const quantity = quantities[idx] || 1;
      const unitPrice = p.prices[0]?.price || 0;
      const installTime = p.contractorIntelligence?.installTimeMinutes || 0;
      const itemTotal = unitPrice * quantity;
      const laborMinutes = installTime * quantity;
      const laborCost = (laborMinutes / 60) * laborCostPerHour;

      return {
        productTitle: p.title,
        quantity,
        unitPrice: Math.round(unitPrice * 100) / 100,
        itemTotal: Math.round(itemTotal * 100) / 100,
        laborMinutes,
        laborCost: Math.round(laborCost * 100) / 100,
      };
    });

    const totalMaterial = itemCosts.reduce((sum, item) => sum + item.itemTotal, 0);
    const totalLabor = itemCosts.reduce((sum, item) => sum + item.laborCost, 0);
    const totalHours = Math.round((itemCosts.reduce((sum, item) => sum + item.laborMinutes, 0) / 60) * 100) / 100;

    return {
      items: itemCosts,
      summary: {
        totalMaterial: Math.round(totalMaterial * 100) / 100,
        totalLabor: Math.round(totalLabor * 100) / 100,
        totalCost: Math.round((totalMaterial + totalLabor) * 100) / 100,
        totalInstallHours: totalHours,
        laborRate: laborCostPerHour,
      },
    };
  }

  /**
   * Get brand reliability ranking for a product type
   */
  async getBrandReliabilityRanking(productType: string) {
    const products = await this.prisma.product.findMany({
      where: { productType: { contains: productType, mode: 'insensitive' as any } },
      include: {
        brand: true,
        contractorIntelligence: true,
        qualityAnalysis: true,
      },
    });

    const byBrand = new Map<string, typeof products>();
    products.forEach((p) => {
      const bn = p.brand?.name || 'Unknown';
      if (!byBrand.has(bn)) byBrand.set(bn, []);
      byBrand.get(bn)!.push(p);
    });

    const rankings = Array.from(byBrand.entries())
      .map(([brand, items]) => {
        const avgFailureRate = items.reduce((sum, p) => sum + (p.contractorIntelligence?.failureRate || 0.05), 0) / (items.length || 1);
        const avgInstallDifficulty = items.reduce((sum, p) => sum + (p.contractorIntelligence?.installDifficulty || 5), 0) / (items.length || 1);
        const avgQuality = items.reduce((sum, p) => sum + (p.qualityAnalysis?.qualityScore || 0), 0) / (items.length || 1);
        const avgContractorScore = items.reduce((sum, p) => sum + (p.contractorIntelligence?.repairCost || 0), 0) / (items.length || 1);

        // Calculate reliability score (lower failure = higher reliability)
        const reliabilityScore = 100 - avgFailureRate * 100;

        return {
          brand,
          productCount: items.length,
          reliabilityScore: Math.round(reliabilityScore * 100) / 100,
          avgFailureRate: Math.round(avgFailureRate * 10000) / 10000,
          avgInstallDifficulty: Math.round(avgInstallDifficulty * 100) / 100,
          avgQualityScore: Math.round(avgQuality * 100) / 100,
          tier: reliabilityScore > 95 ? 'premium' : reliabilityScore > 85 ? 'professional' : 'contractor',
        };
      })
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore);

    return {
      productType,
      totalBrands: rankings.length,
      rankings,
    };
  }

  /**
   * Identify cost savings by comparing to alternatives
   */
  async identifyCostSavings(productId: string, alternativeIds: string[], timeframeYears = 10) {
    const primary = await this.calculateROI(productId, timeframeYears);
    const alternatives = await Promise.all(alternativeIds.map((id) => this.calculateROI(id, timeframeYears)));

    if (!primary || !primary.costs) return null;

    const savingsAnalysis = alternatives
      .filter((alt) => alt && alt.costs && !('error' in alt))
      .map((alt) => {
        const altData = alt as { costs: { totalCostOfOwnership: number }; productTitle: string; brand: string };
        const savingsVsPrimary = altData.costs.totalCostOfOwnership - (primary.costs?.totalCostOfOwnership || 0);
        const savingsPercent = ((savingsVsPrimary / (altData.costs.totalCostOfOwnership || 1)) * 100) * -1;

        return {
          alternativeTitle: altData.productTitle,
          alternativeBrand: altData.brand,
          savingsAmount: Math.round(savingsVsPrimary * 100) / 100,
          savingsPercent: Math.round(savingsPercent * 100) / 100,
          recommendation: savingsVsPrimary > 0 ? 'consider-alternative' : 'stick-with-primary',
        };
      });

    return {
      primaryProduct: primary.productTitle,
      primaryBrand: primary.brand,
      primaryTCO: primary.costs?.totalCostOfOwnership,
      timeframeYears,
      alternatives: savingsAnalysis.sort((a, b) => b.savingsAmount - a.savingsAmount),
      bestAlternative: savingsAnalysis.length > 0 && savingsAnalysis[0].savingsAmount > 0 ? savingsAnalysis[0] : null,
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
