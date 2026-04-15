import { Prisma } from '@prisma/client';

export const USER_SORT_FIELDS = ['createdAt', 'name', 'email'] as const;

export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export const userDefaultOrderBy = [
  { createdAt: 'desc' },
] satisfies Prisma.UserOrderByWithRelationInput[];
