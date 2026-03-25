import { OAuthProvider } from '@prisma/client';

/**
 * Normalised user profile returned by any OAuth strategy's validate() method.
 */
export interface OAuthUser {
  email: string;
  name?: string;
  avatar?: string;
  provider: OAuthProvider;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
  idToken?: string;
}
