import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionHost } from './transaction-host.service';

const providers = [PrismaService, TransactionHost];

@Global()
@Module({
  providers,
  exports: providers,
})
export class PrismaModule {}
