import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionHost } from '../../../prisma/transaction-host.service';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import {
  type UpsertOAuthUserInput,
  type UserWithMemberships,
  type CreateLocalUserInput,
} from '../interfaces/user.interface';
import { userSelect, type SafeUser } from '../selects/user.select';
import { defined } from '../../../common/helpers/prisma.helpers';

@Injectable()
export class UsersService extends TransactionalService {
  constructor(prisma: PrismaService, txHost: TransactionHost) {
    super(prisma, txHost);
  }

  findById(id: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({ where: { id }, select: userSelect });
  }

  findByEmail(email: string): Promise<SafeUser | null> {
    return this.db.user.findUnique({ where: { email }, select: userSelect });
  }

  findByEmailWithPassword(
    email: string,
  ): Promise<(SafeUser & { passwordHash: string | null }) | null> {
    return this.db.user.findUnique({
      where: { email },
      select: { ...userSelect, passwordHash: true },
    });
  }

  findWithMemberships(id: string): Promise<UserWithMemberships | null> {
    return this.db.user.findUnique({
      where: { id },
      select: { ...userSelect, memberships: true },
    });
  }

  /**
   * Creates a new user with a hashed password (local auth).
   * Throws ConflictException if the email already exists.
   */
  @Transactional()
  async createLocalUser(input: CreateLocalUserInput): Promise<SafeUser> {
    const existing = await this.db.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    return this.db.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
      },
      select: userSelect,
    });
  }

  /**
   * Upserts the user and the linked OAuth account in a single transaction.
   * If the user already exists (same email), we update their profile data.
   * If the OAuth account already exists, we refresh the stored tokens.
   */
  @Transactional()
  async upsertOAuthUser(input: UpsertOAuthUserInput): Promise<SafeUser> {
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

    const user = await this.db.user.upsert({
      where: { email },
      create: { email, name, avatar },
      update: defined({
        name,
        avatar,
      }),
      select: userSelect,
    });

    const accountData = defined({
      accessToken,
      refreshToken,
      expiresAt,
      tokenType,
      scope,
      idToken,
    });

    await this.db.oAuthAccount.upsert({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      create: {
        userId: user.id,
        provider,
        providerAccountId,
        ...accountData,
      },
      update: accountData,
    });

    return user;
  }
}
