import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@masco/db';

@Injectable()
export class PriceAlertsService {
  constructor(private prisma: PrismaService) {}

  async createAlert(
    userId: string,
    productId: string,
    targetPrice: number,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (targetPrice <= 0) {
      throw new BadRequestException('Target price must be greater than 0');
    }

    const existing = await this.prisma.priceAlert.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existing) {
      return this.prisma.priceAlert.update({
        where: { id: existing.id },
        data: { targetPrice },
        include: { product: true },
      });
    }

    return this.prisma.priceAlert.create({
      data: {
        userId,
        productId,
        targetPrice,
      },
      include: { product: true },
    });
  }

  async getUserAlerts(userId: string) {
    return this.prisma.priceAlert.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.priceAlert.delete({
      where: { id: alertId },
    });
  }

  async checkTriggeredAlerts() {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { triggered: false },
      include: {
        product: {
          include: {
            prices: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    for (const alert of alerts) {
      const currentPrice = alert.product.prices[0]?.price;

      if (
        currentPrice &&
        currentPrice <= alert.targetPrice &&
        !alert.triggered
      ) {
        await this.prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            triggered: true,
            lastNotifiedAt: new Date(),
          },
        });
      }
    }

    return { checked: alerts.length };
  }

  async resetAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.priceAlert.update({
      where: { id: alertId },
      data: { triggered: false },
    });
  }
}
