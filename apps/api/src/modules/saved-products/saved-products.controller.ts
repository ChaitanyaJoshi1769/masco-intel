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
import { SavedProductsService } from './saved-products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('saved-products')
@UseGuards(JwtAuthGuard)
export class SavedProductsController {
  constructor(private service: SavedProductsService) {}

  @Post()
  async saveProduct(
    @Request() req: any,
    @Body() body: { productId: string; notes?: string },
  ) {
    return this.service.saveProduct(req.user.userId, body.productId, body.notes);
  }

  @Get()
  async getSavedProducts(@Request() req: any) {
    return this.service.getSavedProducts(req.user.userId);
  }

  @Patch(':productId')
  async updateNotes(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() body: { notes: string },
  ) {
    return this.service.updateNotes(req.user.userId, productId, body.notes);
  }

  @Delete(':productId')
  async removeSavedProduct(
    @Request() req: any,
    @Param('productId') productId: string,
  ) {
    return this.service.removeSavedProduct(req.user.userId, productId);
  }
}
