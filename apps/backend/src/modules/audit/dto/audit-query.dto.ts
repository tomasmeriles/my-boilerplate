import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuditAction, AuditResource } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WithSort } from '../../../common/dto/sort-query.dto';
import { WithDateRange } from '../../../common/dto/date-range-query.dto';
import { AUDIT_LOG_SORT_FIELDS } from '../constants/audit-log.constants';

export class AuditQueryDto extends WithDateRange(
  WithSort(AUDIT_LOG_SORT_FIELDS, PaginationQueryDto),
) {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsEnum(AuditResource)
  resource?: AuditResource;
}
