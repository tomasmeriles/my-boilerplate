import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { SafeUser } from '../../modules/users/selects/user.select';

/**
 * Extracts the authenticated user from the request object.
 * Usage: @CurrentUser() user: SafeUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SafeUser => {
    const request = ctx.switchToHttp().getRequest<{ user: SafeUser }>();
    return request.user;
  },
);
