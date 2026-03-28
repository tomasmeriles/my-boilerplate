import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Extracts a cookie value from the request by name.
 * Usage: @Cookie('refresh_token') token: string | undefined
 */
export const Cookie = createParamDecorator(
  (name: string, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.cookies?.[name] as string | undefined;
  },
);
