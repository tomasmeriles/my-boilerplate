import { SetMetadata } from '@nestjs/common';
import type { PolicyHandler } from '../interfaces/ability.interface';

export const CHECK_POLICIES_KEY = 'check_policies';

/**
 * Declares one or more CASL policy checks required to access a route.
 *
 * @example
 * @CheckPolicies((ability) => ability.can('read', 'Tenant'))
 */
export const CheckPolicies = (...handlers: PolicyHandler[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
