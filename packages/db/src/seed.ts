import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create brands
  const deltaBrand = await prisma.brand.upsert({
    where: { name: 'Delta Faucet' },
    update: {},
    create: {
      name: 'Delta Faucet',
      website: 'https://www.deltafaucet.com',
      parent: 'Masco Corporation',
    },
  });

  const brizoBrand = await prisma.brand.upsert({
    where: { name: 'Brizo' },
    update: {},
    create: {
      name: 'Brizo',
      website: 'https://www.brizo.com',
      parent: 'Masco Corporation',
    },
  });

  await prisma.brand.upsert({
    where: { name: 'Hansgrohe' },
    update: {},
    create: {
      name: 'Hansgrohe',
      website: 'https://www.hansgrohe.com',
      parent: 'Masco Corporation',
    },
  });

  // Create retailers
  const homeDepot = await prisma.retailer.upsert({
    where: { name: 'Home Depot' },
    update: {},
    create: {
      name: 'Home Depot',
      domain: 'homedepot.com',
    },
  });

  const lowes = await prisma.retailer.upsert({
    where: { name: 'Lowes' },
    update: {},
    create: {
      name: 'Lowes',
      domain: 'lowes.com',
    },
  });

  const amazon = await prisma.retailer.upsert({
    where: { name: 'Amazon' },
    update: {},
    create: {
      name: 'Amazon',
      domain: 'amazon.com',
    },
  });

  // Create products
  const deltaFaucet = await prisma.product.upsert({
    where: { sku_brandId: { sku: 'DLT-32151', brandId: deltaBrand.id } },
    update: {},
    create: {
      sku: 'DLT-32151',
      upc: '034449321516',
      mpn: '25984LF-PC',
      title: 'Delta Lahara Single Handle Kitchen Faucet',
      description:
        'Chrome finish single handle kitchen faucet with pull-down sprayer and touch activation.',
      brandId: deltaBrand.id,
      collection: 'Lahara',
      productType: 'faucet',
      finish: 'Chrome',
      specifications: {
        'Flow Rate': '1.8 GPM',
        'Valve Type': 'Cartridge',
        'Handle Type': 'Single Handle',
        'Spout Type': 'Pull-Down',
        'Spray Type': 'Multi-Function Spray',
        'Installation': 'Single Hole',
      },
      certifications: ['WaterSense', 'cUPC'],
      estimatedGrade: 'mid-range',
    },
  });

  const brizoFaucet = await prisma.product.upsert({
    where: { sku_brandId: { sku: 'BRZ-65000LF-PC', brandId: brizoBrand.id } },
    update: {},
    create: {
      sku: 'BRZ-65000LF-PC',
      mpn: '65000LF-PC',
      title: 'Brizo Solna Single Handle Kitchen Faucet',
      description: 'Polished chrome single handle kitchen faucet with advanced spray technology.',
      brandId: brizoBrand.id,
      collection: 'Solna',
      productType: 'faucet',
      finish: 'Polished Chrome',
      specifications: {
        'Flow Rate': '1.8 GPM',
        'Valve Type': 'Cartridge',
        'Handle Type': 'Single Handle',
        'Spout Type': 'Pull-Down',
        'Material': 'Brass',
        'Installation': 'Single Hole',
      },
      certifications: ['WaterSense', 'cUPC', 'NSF'],
      estimatedGrade: 'premium',
    },
  });

  // Create price history
  await prisma.priceHistory.create({
    data: {
      productId: deltaFaucet.id,
      retailerId: homeDepot.id,
      price: 89.99,
      url: 'https://www.homedepot.com/p/Delta-Lahara...',
      inStock: true,
    },
  });

  await prisma.priceHistory.create({
    data: {
      productId: deltaFaucet.id,
      retailerId: lowes.id,
      price: 85.99,
      url: 'https://www.lowes.com/p/Delta-Lahara...',
      inStock: true,
    },
  });

  await prisma.priceHistory.create({
    data: {
      productId: brizoFaucet.id,
      retailerId: amazon.id,
      price: 299.99,
      url: 'https://www.amazon.com/Brizo-Solna...',
      inStock: true,
    },
  });

  // Create quality analysis
  await prisma.qualityAnalysis.create({
    data: {
      productId: deltaFaucet.id,
      qualityScore: 0.72,
      serviceabilityScore: 0.75,
      contractorScore: 0.7,
      longevityScore: 0.68,
      repairabilityScore: 0.7,
      hasPlasticComponents: true,
      warrantyYears: 5,
      repairPartsAvailable: true,
      estimatedLifespan: 10,
      commonFailures: ['Cartridge wear', 'Aerator clogging'],
    },
  });

  await prisma.qualityAnalysis.create({
    data: {
      productId: brizoFaucet.id,
      qualityScore: 0.88,
      serviceabilityScore: 0.85,
      contractorScore: 0.82,
      longevityScore: 0.9,
      repairabilityScore: 0.87,
      hasPlasticComponents: false,
      warrantyYears: 10,
      repairPartsAvailable: true,
      estimatedLifespan: 20,
      commonFailures: [],
    },
  });

  // Create contractor intelligence
  await prisma.contractorIntelligence.create({
    data: {
      productId: deltaFaucet.id,
      failureRate: 0.08,
      repairCost: 50,
      installDifficulty: 4,
      longevity: 10,
      commonIssues: ['Cartridge replacement needed after 8-10 years'],
      installTimeMinutes: 45,
    },
  });

  await prisma.contractorIntelligence.create({
    data: {
      productId: brizoFaucet.id,
      failureRate: 0.02,
      repairCost: 75,
      installDifficulty: 3,
      longevity: 20,
      commonIssues: [],
      installTimeMinutes: 40,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${2} brands`);
  console.log(`   - ${3} retailers`);
  console.log(`   - ${2} products`);
  console.log(`   - ${3} price records`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
