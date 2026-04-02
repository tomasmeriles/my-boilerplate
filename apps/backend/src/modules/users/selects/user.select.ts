import { Prisma } from '@prisma/client';

export const userSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  globalRole: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;
