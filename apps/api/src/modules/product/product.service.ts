import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        sku: data.sku,
        upc: data.upc,
        mpn: data.mpn,
        title: data.title,
        description: data.description,
        collection: data.collection,
        productType: data.productType,
        finish: data.finish,
        valveType: data.valveType,
        specifications: data.specifications || {},
        certifications: data.certifications || [],
        estimatedGrade: data.estimatedGrade || 'mid-range',
        imageUrl: data.imageUrl,
        brand: {
          connectOrCreate: {
            where: { name: data.brand },
            create: { name: data.brand },
          },
        },
      },
      include: { brand: true },
    });
  }

  async findBySku(sku: string) {
    return this.prisma.product.findFirst({
      where: { sku },
      include: {
        brand: true,
        qualityAnalysis: true,
        contractorIntelligence: true,
        prices: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });
  }

  async findByMpn(mpn: string) {
    return this.prisma.product.findFirst({
      where: { mpn },
      include: {
        brand: true,
        qualityAnalysis: true,
        contractorIntelligence: true,
        prices: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    });
  }

  async search(query: string, limit = 10) {
    return this.prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      include: {
        brand: true,
        prices: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  async findAlternatives(productId: string, limit = 5) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return [];

    // Find alternatives by similarity (same finish, same product type, same price range)
    return this.prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { productType: product.productType },
          { finish: product.finish },
        ],
      },
      take: limit,
      include: {
        brand: true,
        prices: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
