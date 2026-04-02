import { Injectable } from '@nestjs/common';
import { AuditAction, AuditResource, Prisma } from '@prisma/client';
import { Page } from '../../../common/interfaces/page.interface';
import {
  buildFindManyArgs,
  dateRange,
  defined,
  toOrderBy,
} from '../../../common/helpers/prisma.helpers';
import { AuditQueryDto } from '../dto/audit-query.dto';
import {
  auditLogDefaultOrderBy,
  AuditLogPayload,
  auditLogSelect,
} from '../selects/audit-log.select';
import { PrismaService } from '../../../prisma/prisma.service';
import { TransactionalService } from '../../../common/base/transactional-service.base';
import { TransactionHost } from '../../../prisma/transaction-host.service';
import {
  Propagation,
  Transactional,
} from '../../../common/decorators/transactional.decorator';

export interface CreateAuditLogInput {
  userId?: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  requestId?: string | null;
  success?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService extends TransactionalService {
  constructor(prisma: PrismaService, txHost: TransactionHost) {
    super(prisma, txHost);
  }

  @Transactional({ propagation: Propagation.REQUIRES_NEW })
  async log(input: CreateAuditLogInput): Promise<void> {
    await this.db.auditLog.create({ data: input });
  }

  async findMany(query: AuditQueryDto): Promise<Page<AuditLogPayload>> {
    const {
      userId,
      action,
      resource,
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const args = buildFindManyArgs({
      select: auditLogSelect,
      where: {
        ...defined({ userId, action, resource }),
        createdAt: dateRange(from, to),
      },
      orderBy: toOrderBy(sortBy, sortOrder, auditLogDefaultOrderBy),
      pagination: query,
    });

    const [data, total] = await this.db.$transaction([
      this.db.auditLog.findMany(args),
      this.db.auditLog.count({ where: args.where }),
    ]);

    return { data, total, page, limit };
  }
}
