import { OAuthProvider, type TenantMember } from '@prisma/client';
import type { SafeUser } from '../selects/user.select';

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

export type UserWithMemberships = SafeUser & { memberships: TenantMember[] };

export interface CreateLocalUserInput {
  email: string;
  name: string;
  passwordHash: string;
}
