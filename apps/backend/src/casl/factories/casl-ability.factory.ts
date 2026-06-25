import { Injectable } from '@nestjs/common';
import { createMongoAbility, subject } from '@casl/ability';
import { GlobalRole, TenantRole } from '@prisma/client';
import type {
  AppAbility,
  PackedAbility,
} from '../interfaces/ability.interface';
import type { UserWithMemberships } from '../../modules/users/interfaces/user.interface';

@Injectable()
export class CaslAbilityFactory {
  /**
   * Builds the ability set for a user across ALL of their tenant memberships
   * at once. Per-resource checks must validate the tenantId from the request
   * (e.g. a route param) against these conditions - never resolve "which
   * tenant" from a client-supplied header, since that can be spoofed
   * independently of the resource actually being accessed.
   */
  buildAbilities(user: UserWithMemberships): AppAbility {
    const rules: PackedAbility[] = [];

    // SUPER_ADMIN can do everything everywhere
    if (user.globalRole === GlobalRole.SUPER_ADMIN) {
      rules.push({ action: 'manage', subject: 'all' });
      return createMongoAbility<AppAbility>(rules);
    }

    // TENANT_MANAGER can manage all tenants and their members, nothing else
    if (user.globalRole === GlobalRole.TENANT_MANAGER) {
      rules.push({ action: 'manage', subject: 'Tenant' });
      rules.push({ action: 'manage', subject: 'TenantMember' });
      rules.push({
        action: 'read',
        subject: 'User',
        conditions: { id: user.id },
      });
      rules.push({
        action: 'update',
        subject: 'User',
        conditions: { id: user.id },
      });
      return createMongoAbility<AppAbility>(rules);
    }

    // Tenant-scoped rules based on memberships - one set of rules per tenant
    // the user actually belongs to, all returned together. Callers narrow
    // down to a single tenant by checking the resource's own tenantId
    // (from the URL), not by asking the factory to scope to one up front.
    for (const membership of user.memberships) {
      const { tenantId } = membership;

      switch (membership.role) {
        case TenantRole.OWNER:
          rules.push({
            action: 'manage',
            subject: 'Tenant',
            conditions: { id: tenantId },
          });
          rules.push({
            action: 'manage',
            subject: 'TenantMember',
            conditions: { tenantId },
          });
          rules.push({
            action: 'read',
            subject: 'User',
            conditions: { 'memberships.tenantId': tenantId },
          });
          break;

        case TenantRole.ADMIN:
          rules.push({
            action: 'read',
            subject: 'Tenant',
            conditions: { id: tenantId },
          });
          rules.push({
            action: 'create',
            subject: 'TenantMember',
            conditions: { tenantId },
          });
          rules.push({
            action: 'read',
            subject: 'TenantMember',
            conditions: { tenantId },
          });
          rules.push({
            action: 'update',
            subject: 'TenantMember',
            conditions: { tenantId },
          });
          rules.push({
            action: 'read',
            subject: 'User',
            conditions: { 'memberships.tenantId': tenantId },
          });
          break;

        case TenantRole.MEMBER:
        default:
          rules.push({
            action: 'read',
            subject: 'Tenant',
            conditions: { id: tenantId },
          });
          rules.push({
            action: 'read',
            subject: 'TenantMember',
            conditions: { tenantId },
          });
          break;
      }
    }

    // Every authenticated user can read/update their own profile
    rules.push({
      action: 'read',
      subject: 'User',
      conditions: { id: user.id },
    });
    rules.push({
      action: 'update',
      subject: 'User',
      conditions: { id: user.id },
    });

    return createMongoAbility<AppAbility>(rules);
  }
}

// Re-export subject helper so consumers don't need to import from @casl/ability directly
export { subject };
