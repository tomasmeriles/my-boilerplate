import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionHost } from '../../../prisma/transaction-host.service';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { Transactional } from '../../../common/decorators/transactional.decorator';
import type {
  UpsertOAuthUserInput,
  UserWithMemberships,
} from '../interfaces/user.interface';
import { defined } from '../../../common/helpers/prisma.helpers';

@Injectable()
export class UsersService extends TransactionalService {
  constructor(prisma: PrismaService, txHost: TransactionHost) {
    super(prisma, txHost);
  }

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  findWithMemberships(id: string): Promise<UserWithMemberships | null> {
    return this.db.user.findUnique({
      where: { id },
      include: { memberships: true },
    });
  }

  /**
   * Upserts the user and the linked OAuth account in a single transaction.
   * If the user already exists (same email), we update their profile data.
   * If the OAuth account already exists, we refresh the stored tokens.
   */
  @Transactional()
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

    const user = await this.db.user.upsert({
      where: { email },
      create: { email, name, avatar },
      update: defined({
        name,
        avatar,
      }),
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
