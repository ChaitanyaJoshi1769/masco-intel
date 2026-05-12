import { Module } from '@nestjs/common';
import { SavedProductsService } from './saved-products.service';
import { SavedProductsController } from './saved-products.controller';
import { DbModule } from '@masco/db';

@Module({
  imports: [DbModule],
  controllers: [SavedProductsController],
  providers: [SavedProductsService],
})
export class SavedProductsModule {}
