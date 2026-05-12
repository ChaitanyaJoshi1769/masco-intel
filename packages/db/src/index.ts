import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DbModule {}
