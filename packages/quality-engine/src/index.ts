/**
 * Quality Analysis Engine
 *
 * Analyzes product data to determine quality tier, durability, and suitability
 * for different customer segments (consumer, contractor, builder).
 */

export interface QualityFactors {
  price: number;
  brand: string;
  warranty: number;
  materialComposition: string;
  certifications: string[];
  collection: string;
  productType: string;
  specifications: Record<string, string>;
  reviews?: {
    rating: number;
    count: number;
  };
}

export interface QualityScore {
  overall: number; // 0-100
  durability: number; // How long it lasts
  repairability: number; // Ease of fixing
  materials: number; // Material quality
  warranty: number; // Warranty coverage
  contractor_ready: number; // Suitable for pros
}

export interface QualityAnalysis {
  grade: 'builder-grade' | 'mid-range' | 'premium' | 'luxury';
  scores: QualityScore;
  confidence: number; // 0-1
  reasoning: string[];
  recommendations: string[];
  estimated_lifespan: number; // years
  maintenance_cost: string; // low, medium, high
}

const LUXURY_BRANDS = [
  'Brizo',
  'Axor',
  'Hansgrohe',
  'Watermark',
  'Rohl',
  'Perrin & Rowe',
];

const BUILDER_BRANDS = ['Glacier Bay', 'Delta basic', 'Moen basic', 'Kohler Bancroft'];

const PREMIUM_BRANDS = ['Delta', 'Moen', 'Kohler', 'Peerless', 'Newport Brass'];

const LUXURY_COLLECTIONS = ['Solna', 'Brizo Litze', 'Starck', 'Talis', 'Karbon'];

const WARRANTY_YEARS = {
  lifetime: 100,
  limited_lifetime: 50,
  '10': 10,
  '5': 5,
  '2': 2,
  '1': 1,
};

/**
 * Analyzes product quality based on multiple factors
 */
export function analyzeQuality(factors: QualityFactors): QualityAnalysis {
  const scores = calculateQualityScores(factors);
  const overall = calculateOverallScore(scores);
  const grade = determineGrade(overall, factors);
  const confidence = calculateConfidence(factors);
  const reasoning = generateReasoning(factors, scores);
  const lifespan = estimateLifespan(factors, scores);
  const maintenance = estimateMaintenanceCost(factors);

  return {
    grade,
    scores,
    confidence,
    reasoning,
    recommendations: generateRecommendations(grade, factors),
    estimated_lifespan: lifespan,
    maintenance_cost: maintenance,
  };
}

/**
 * Calculate individual quality dimension scores
 */
function calculateQualityScores(factors: QualityFactors): QualityScore {
  return {
    durability: calculateDurabilityScore(factors),
    repairability: calculateRepairabilityScore(factors),
    materials: calculateMaterialScore(factors),
    warranty: calculateWarrantyScore(factors),
    contractor_ready: calculateContractorScore(factors),
    overall: 0, // Will be calculated
  };
}

function calculateDurabilityScore(factors: QualityFactors): number {
  let score = 50;

  // Material quality is key indicator
  const materialLower = factors.materialComposition?.toLowerCase() || '';
  if (materialLower.includes('brass') || materialLower.includes('stainless')) {
    score += 20;
  }
  if (materialLower.includes('plastic')) {
    score -= 15;
  }
  if (materialLower.includes('zinc') || materialLower.includes('pot metal')) {
    score -= 10;
  }

  // Warranty indicates confidence
  score += factors.warranty * 2;

  // Brand history
  if (LUXURY_BRANDS.includes(factors.brand)) {
    score += 15;
  } else if (PREMIUM_BRANDS.includes(factors.brand)) {
    score += 10;
  } else if (BUILDER_BRANDS.includes(factors.brand)) {
    score -= 15;
  }

  // Certifications add durability confidence
  const certs = (factors.certifications || []).join('').toLowerCase();
  if (certs.includes('nsf')) score += 5;
  if (certs.includes('lead-free')) score += 3;
  if (certs.includes('cuc')) score += 5;

  return Math.max(0, Math.min(100, score));
}

function calculateRepairabilityScore(factors: QualityFactors): number {
  let score = 50;

  // Common brands have parts availability
  if (PREMIUM_BRANDS.includes(factors.brand) || LUXURY_BRANDS.includes(factors.brand)) {
    score += 20;
  } else if (BUILDER_BRANDS.includes(factors.brand)) {
    score -= 5;
  }

  // Cartridge-based faucets are more repairable
  const specsStr = JSON.stringify(factors.specifications).toLowerCase();
  if (specsStr.includes('cartridge')) {
    score += 15;
  } else if (specsStr.includes('ball valve')) {
    score += 10;
  }

  // Plastic components hurt repairability
  if (factors.materialComposition?.toLowerCase().includes('plastic')) {
    score -= 10;
  }

  // Price point affects parts availability
  if (factors.price > 300) {
    score += 10; // Luxury items have better support
  }

  return Math.max(0, Math.min(100, score));
}

function calculateMaterialScore(factors: QualityFactors): number {
  let score = 50;

  const material = factors.materialComposition?.toLowerCase() || '';

  // Material quality hierarchy
  if (material.includes('solid brass')) {
    score = 90;
  } else if (material.includes('brass')) {
    score = 80;
  } else if (material.includes('stainless steel')) {
    score = 85;
  } else if (material.includes('chrome plated')) {
    score = 70;
  } else if (material.includes('plastic') || material.includes('composite')) {
    score = 40;
  } else if (material.includes('zinc')) {
    score = 50;
  }

  // Luxury brands typically use better materials
  if (LUXURY_BRANDS.includes(factors.brand)) {
    score = Math.max(score, 85);
  }

  return score;
}

function calculateWarrantyScore(factors: QualityFactors): number {
  // Direct mapping: years to score
  if (factors.warranty >= 10) return 90;
  if (factors.warranty >= 5) return 75;
  if (factors.warranty >= 2) return 60;
  if (factors.warranty >= 1) return 40;
  return 20;
}

function calculateContractorScore(factors: QualityFactors): number {
  let score = 50;

  // Premium brands are contractor-preferred
  if (LUXURY_BRANDS.includes(factors.brand)) {
    score += 25;
  } else if (PREMIUM_BRANDS.includes(factors.brand)) {
    score += 15;
  } else if (BUILDER_BRANDS.includes(factors.brand)) {
    score -= 20;
  }

  // Durability matters to contractors
  const durability = calculateDurabilityScore(factors);
  score += durability * 0.2;

  // Warranty confidence
  score += Math.min(factors.warranty * 3, 20);

  // Easy installation is valued
  const specsStr = JSON.stringify(factors.specifications).toLowerCase();
  if (specsStr.includes('easy install') || specsStr.includes('quick') || specsStr.includes('universal')) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateOverallScore(scores: QualityScore): number {
  return Math.round(
    (scores.durability * 0.3 +
      scores.repairability * 0.2 +
      scores.materials * 0.2 +
      scores.warranty * 0.15 +
      scores.contractor_ready * 0.15) /
      5
  );
}

function determineGrade(
  overall: number,
  factors: QualityFactors
): 'builder-grade' | 'mid-range' | 'premium' | 'luxury' {
  // Check brand first (strong signal)
  if (LUXURY_BRANDS.includes(factors.brand)) return 'luxury';
  if (PREMIUM_BRANDS.includes(factors.brand) && overall >= 65) return 'premium';
  if (BUILDER_BRANDS.includes(factors.brand)) return 'builder-grade';

  // Then price point
  if (factors.price > 400) return 'luxury';
  if (factors.price > 200) return 'premium';
  if (factors.price > 100) return 'mid-range';
  return 'builder-grade';
}

function calculateConfidence(factors: QualityFactors): number {
  let confidence = 0.5;

  // More data = higher confidence
  if (factors.brand && factors.brand !== 'Unknown') confidence += 0.1;
  if (factors.warranty > 0) confidence += 0.1;
  if (factors.specifications && Object.keys(factors.specifications).length > 3) confidence += 0.1;
  if (factors.certifications && factors.certifications.length > 0) confidence += 0.1;

  return Math.min(confidence, 1);
}

function estimateLifespan(factors: QualityFactors, scores: QualityScore): number {
  let years = 10; // Base estimate

  // Material quality adds years
  const material = factors.materialComposition?.toLowerCase() || '';
  if (material.includes('solid brass')) years = 25;
  else if (material.includes('brass')) years = 20;
  else if (material.includes('stainless')) years = 22;
  else if (material.includes('plastic')) years = 5;

  // Warranty is a manufacturer guarantee
  if (factors.warranty >= 10) years = Math.max(years, 15);

  // Luxury brands engineered for longevity
  if (LUXURY_BRANDS.includes(factors.brand)) years = Math.max(years, 20);

  return Math.round(years);
}

function estimateMaintenanceCost(factors: QualityFactors): string {
  if (factors.price > 300) return 'medium'; // Expensive parts but less frequent
  if (factors.price > 150) return 'medium';
  return 'high'; // Budget items fail more often
}

function generateReasoning(factors: QualityFactors, scores: QualityScore): string[] {
  const reasons: string[] = [];

  if (scores.durability < 50) {
    reasons.push('Lower durability rating due to material composition');
  }
  if (scores.repairability < 50) {
    reasons.push('Limited repair parts availability');
  }
  if (scores.materials > 75) {
    reasons.push('High-quality material construction');
  }
  if (scores.warranty > 70) {
    reasons.push('Strong warranty coverage indicates manufacturer confidence');
  }
  if (scores.contractor_ready > 70) {
    reasons.push('Highly recommended for professional contractors');
  }

  return reasons;
}

function generateRecommendations(
  grade: string,
  factors: QualityFactors
): string[] {
  const recommendations: string[] = [];

  switch (grade) {
    case 'builder-grade':
      recommendations.push('Best for basic installations or renters');
      recommendations.push('Plan for replacement in 8-10 years');
      recommendations.push('Budget-friendly option');
      break;
    case 'mid-range':
      recommendations.push('Good balance of quality and cost');
      recommendations.push('Suitable for most home applications');
      recommendations.push('Expected lifespan: 12-15 years');
      break;
    case 'premium':
      recommendations.push('Recommended for renovations');
      recommendations.push('Better durability and repair support');
      recommendations.push('Professional installation recommended');
      break;
    case 'luxury':
      recommendations.push('Premium choice for high-end installations');
      recommendations.push('Exceptional durability (20+ years)');
      recommendations.push('Complete contractor support');
      recommendations.push('Warranty coverage typically lifetime');
      break;
  }

  return recommendations;
}

// Export for API use
export const QualityEngine = {
  analyzeQuality,
  calculateQualityScores,
};
