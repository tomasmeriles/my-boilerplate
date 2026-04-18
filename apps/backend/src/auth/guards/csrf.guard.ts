import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '../../config/services/config.service';

export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

/** HTTP methods that do not mutate state — CSRF validation skipped. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Global CSRF guard (Signed Double Submit Cookie pattern).
 *
 * Token format: `<random>.<hmac-sha256(CSRF_SECRET, random)>`
 *
 * On every state-changing request to a protected route the browser must
 * forward the cookie value in the `x-csrf-token` header.  The guard then:
 *   1. Checks cookie === header (double-submit)
 *   2. Verifies the HMAC signature so an injected/forged cookie is rejected
 *      even if an attacker can write to a parent domain cookie jar.
 *
 * Routes decorated with `@Public()` are skipped because they have no
 * authenticated session that an attacker could hijack.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(req.method)) return true;

    const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
    const headerToken = req.headers[CSRF_HEADER] as string | undefined;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException('Missing CSRF token');
    }

    // 1. Double-submit: cookie and header must carry the same value.
    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken);

    if (
      cookieBuf.length !== headerBuf.length ||
      !timingSafeEqual(cookieBuf, headerBuf)
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    // 2. Verify HMAC signature so injected cookies are rejected.
    //    Expected format: "<random>.<signature>"
    const dotIndex = cookieToken.lastIndexOf('.');
    if (dotIndex === -1) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    const random = cookieToken.slice(0, dotIndex);
    const providedSig = cookieToken.slice(dotIndex + 1);

    const secret = this.config.get('CSRF_SECRET');
    const expectedSig = createHmac('sha256', secret)
      .update(random)
      .digest('hex');

    const providedBuf = Buffer.from(providedSig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
