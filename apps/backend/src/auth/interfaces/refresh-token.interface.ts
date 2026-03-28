import { RefreshToken, User } from '@prisma/client';

export type RefreshTokenWithUser = RefreshToken & { user: User };
