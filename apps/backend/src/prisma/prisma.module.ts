import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

const providers = [PrismaService];

@Global()
@Module({
  providers,
  exports: providers,
})
export class PrismaModule {}
