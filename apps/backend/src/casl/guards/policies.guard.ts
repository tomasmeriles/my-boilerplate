import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CaslAbilityFactory } from '../factories/casl-ability.factory';
import { AbilityCacheService } from '../services/ability-cache.service';
import { UsersService } from '../../modules/users/services/users.service';
import { CHECK_POLICIES_KEY } from '../decorators/check-policies.decorator';
import type { PolicyHandler } from '../interfaces/ability.interface';
import { createMongoAbility } from '@casl/ability';
import type { AppAbility } from '../interfaces/ability.interface';
import type { SafeUser } from '../../modules/users/selects/user.select';

@Injectable()
export class PoliciesGuard implements CanActivate {
  private readonly logger = new Logger(PoliciesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: CaslAbilityFactory,
    private readonly abilityCache: AbilityCacheService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handlers = this.reflector.getAllAndOverride<PolicyHandler[]>(
      CHECK_POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @CheckPolicies decorator - allow through
    if (!handlers || handlers.length === 0) return true;

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: SafeUser }>();
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const tenantId = this.extractTenantId(req);

    const ability = await this.resolveAbility(userId, tenantId);

    const allowed = handlers.every((handler) => handler(ability, req));

    if (!allowed) throw new ForbiddenException();

    return true;
  }

  private extractTenantId(req: Request): string | null {
    const header = req.headers['x-tenant-id'];
    return typeof header === 'string' && header.length > 0 ? header : null;
  }

  private async resolveAbility(
    userId: string,
    tenantId: string | null,
  ): Promise<AppAbility> {
    // 1. Try Redis cache
    const cached = await this.abilityCache.get(userId, tenantId);
    if (cached) {
      return createMongoAbility<AppAbility>(cached);
    }

    // 2. Build from DB
    const user = await this.users.findWithMemberships(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    const ability = this.abilityFactory.buildAbilities(user, tenantId);

    // 3. Cache the raw rules
    await this.abilityCache.set(userId, tenantId, ability.rules);

    return ability;
  }
}
