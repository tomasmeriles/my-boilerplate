import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertOAuthUserInput } from '../interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Upserts the user and the linked OAuth account in a single transaction.
   * If the user already exists (same email), we update their profile data.
   * If the OAuth account already exists, we refresh the stored tokens.
   */
  async upsertOAuthUser(input: UpsertOAuthUserInput): Promise<User> {
    const {
      email,
      name,
      avatar,
      provider,
      providerAccountId,
      accessToken,
      refreshToken,
      expiresAt,
      tokenType,
      scope,
      idToken,
    } = input;

    return this.prisma.$transaction(async (tx) => {
      // Upsert the user row
      const user = await tx.user.upsert({
        where: { email },
        create: { email, name, avatar },
        update: {
          name: name ?? Prisma.skip,
          avatar: avatar ?? Prisma.skip,
        },
      });

      // Upsert the OAuth account row
      await tx.oAuthAccount.upsert({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        create: {
          userId: user.id,
          provider,
          providerAccountId,
          accessToken: accessToken ?? Prisma.skip,
          refreshToken: refreshToken ?? Prisma.skip,
          expiresAt: expiresAt ?? Prisma.skip,
          tokenType: tokenType ?? Prisma.skip,
          scope: scope ?? Prisma.skip,
          idToken: idToken ?? Prisma.skip,
        },
        update: {
          accessToken: accessToken ?? Prisma.skip,
          refreshToken: refreshToken ?? Prisma.skip,
          expiresAt: expiresAt ?? Prisma.skip,
          tokenType: tokenType ?? Prisma.skip,
          scope: scope ?? Prisma.skip,
          idToken: idToken ?? Prisma.skip,
        },
      });

      return user;
    });
  }
}
