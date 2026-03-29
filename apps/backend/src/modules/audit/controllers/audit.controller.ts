import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Page } from '../../../common/interfaces/page.interface';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AuditQueryDto } from '../dto/audit-query.dto';
import { AuditLogPayload } from '../selects/audit-log.select';
import { AuditService } from '../services/audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('logs')
  getLogs(@Query() query: AuditQueryDto): Promise<Page<AuditLogPayload>> {
    return this.audit.findMany(query);
  }
}
