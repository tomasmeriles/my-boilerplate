import { Injectable } from '@nestjs/common';
import { AuditAction, AuditResource, Prisma } from '@prisma/client';
import { Page } from '../../../common/interfaces/page.interface';
import {
  dateRange,
  defined,
  paginate,
  toOrderBy,
} from '../../../common/helpers/prisma.helpers';
import { AuditQueryDto } from '../dto/audit-query.dto';
import { AuditLogPayload, auditLogSelect } from '../selects/audit-log.select';
import { auditLogDefaultOrderBy } from '../constants/audit-log.constants';
import { TransactionalService } from '../../../common/base/transactional-service.base';

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
  async log(input: CreateAuditLogInput): Promise<void> {
    await this.db.auditLog.create({ data: defined(input) });
  }

  findMany(query: AuditQueryDto): Promise<Page<AuditLogPayload>> {
    const { userId, action, resource, sortBy, sortOrder } = query;

    const where = defined({
      userId,
      action,
      resource,
      createdAt: dateRange(query.fromUtc, query.toUtc),
    });

    return paginate<AuditLogPayload>(
      query,
      () =>
        this.db.auditLog.findMany({
          select: auditLogSelect,
          where,
          orderBy: toOrderBy(sortBy, sortOrder, auditLogDefaultOrderBy),
          skip: query.skip,
          take: query.limit,
        }),
      () => this.db.auditLog.count({ where }),
    );
  }
}
