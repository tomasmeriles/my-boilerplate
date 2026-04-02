import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './factories/casl-ability.factory';
import { AbilityCacheService } from './services/ability-cache.service';
import { PoliciesGuard } from './guards/policies.guard';
import { RedisModule } from '../redis/redis.module';
import { UsersModule } from '../modules/users/users.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [RedisModule, UsersModule, ConfigModule],
  providers: [CaslAbilityFactory, AbilityCacheService, PoliciesGuard],
  exports: [CaslAbilityFactory, AbilityCacheService, PoliciesGuard],
})
export class CaslModule {}
