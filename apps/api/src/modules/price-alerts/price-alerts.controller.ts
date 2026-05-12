import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PriceAlertsService } from './price-alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
export class PriceAlertsController {
  constructor(private service: PriceAlertsService) {}

  @Post()
  async createAlert(
    @Request() req: any,
    @Body() body: { productId: string; targetPrice: number },
  ) {
    return this.service.createAlert(
      req.user.userId,
      body.productId,
      body.targetPrice,
    );
  }

  @Get()
  async getUserAlerts(@Request() req: any) {
    return this.service.getUserAlerts(req.user.userId);
  }

  @Delete(':alertId')
  async deleteAlert(@Request() req: any, @Param('alertId') alertId: string) {
    return this.service.deleteAlert(req.user.userId, alertId);
  }

  @Patch(':alertId/reset')
  async resetAlert(@Request() req: any, @Param('alertId') alertId: string) {
    return this.service.resetAlert(req.user.userId, alertId);
  }
}
