import { Controller, Get, Query } from '@nestjs/common';
import { Page } from '../../../common/interfaces/page.interface';
import { CheckPolicies } from '../../../casl/decorators/check-policies.decorator';
import { AuditQueryDto } from '../dto/audit-query.dto';
import { AuditLogPayload } from '../selects/audit-log.select';
import { AuditService } from '../services/audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('logs')
  @CheckPolicies((ability) => ability.can('read', 'AuditLog'))
  getLogs(@Query() query: AuditQueryDto): Promise<Page<AuditLogPayload>> {
    return this.audit.findMany(query);
  }
}
