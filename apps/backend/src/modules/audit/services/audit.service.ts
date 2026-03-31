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

export interface CreateAuditLogInput {
  userId?: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  success?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({ data: input });
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

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany(args),
      this.prisma.auditLog.count({ where: args.where }),
    ]);

    return { data, total, page, limit };
  }
}
