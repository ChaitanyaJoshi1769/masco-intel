import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@masco/db';

@Injectable()
export class SavedProductsService {
  constructor(private prisma: PrismaService) {}

  async saveProduct(
    userId: string,
    productId: string,
    notes?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.prisma.savedProduct.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      return this.prisma.savedProduct.update({
        where: { id: existing.id },
        data: { notes },
        include: { product: true },
      });
    }

    return this.prisma.savedProduct.create({
      data: {
        userId,
        productId,
        notes,
      },
      include: { product: true },
    });
  }

  async getSavedProducts(userId: string) {
    return this.prisma.savedProduct.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            prices: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
            qualityAnalysis: true,
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });
  }

  async removeSavedProduct(userId: string, productId: string) {
    const saved = await this.prisma.savedProduct.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!saved) {
      throw new NotFoundException('Saved product not found');
    }

    return this.prisma.savedProduct.delete({
      where: { id: saved.id },
    });
  }

  async updateNotes(
    userId: string,
    productId: string,
    notes: string,
  ) {
    const saved = await this.prisma.savedProduct.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!saved) {
      throw new NotFoundException('Saved product not found');
    }

    return this.prisma.savedProduct.update({
      where: { id: saved.id },
      data: { notes },
      include: { product: true },
    });
  }
}
