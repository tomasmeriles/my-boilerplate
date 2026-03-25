import { OAuthProvider } from '@prisma/client';

export interface UpsertOAuthUserInput {
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
