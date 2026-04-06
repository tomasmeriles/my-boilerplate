import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { TransactionHost } from './services/transaction-host.service';

const providers = [PrismaService, TransactionHost];

@Global()
@Module({
  providers,
  exports: providers,
})
export class PrismaModule {}
