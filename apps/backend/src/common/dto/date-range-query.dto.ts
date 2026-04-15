import { IsISO8601, IsOptional } from 'class-validator';
import { IsIANATimezone } from '../decorators/is-iana-timezone.decorator';
import { IsDateRangeValid } from '../decorators/is-date-range-valid.decorator';
import { endOfDayUtc, startOfDayUtc } from '../helpers/date.helpers';

type Constructor = new (...args: any[]) => object;

/**
 * Mixin that adds timezone-aware `from` / `to` date-range query params
 * to any DTO and exposes pre-converted UTC `Date` getters for use in services.
 *
 * `from` and `to` accept any ISO 8601 string (`YYYY-MM-DD` or full datetime).
 * Date-only values are expanded to the start/end of the day in `timezone`.
 * `timezone` defaults to `'UTC'` when omitted.
 *
 * @example - combined with WithSort and PaginationQueryDto
 * export class AuditQueryDto extends WithDateRange(
 *   WithSort(AUDIT_LOG_SORT_FIELDS, PaginationQueryDto),
 * ) { ... }
 *
 * @example - reading UTC dates in a service
 * createdAt: dateRange(query.fromUtc, query.toUtc)
 */
export function WithDateRange<TBase extends Constructor>(Base: TBase) {
  class DateRangeMixin extends Base {
    @IsOptional()
    @IsISO8601({ strict: true })
    from?: string;

    @IsOptional()
    @IsISO8601({ strict: true })
    @IsDateRangeValid()
    to?: string;

    @IsOptional()
    @IsIANATimezone()
    timezone: string = 'UTC';

    /**
     * `from` shifted to the start of the day (00:00:00.000) in `timezone`,
     * then converted to UTC. `undefined` when `from` is not set.
     */
    get fromUtc(): Date | undefined {
      return this.from ? startOfDayUtc(this.from, this.timezone) : undefined;
    }

    /**
     * `to` shifted to the end of the day (23:59:59.999) in `timezone`,
     * then converted to UTC. `undefined` when `to` is not set.
     */
    get toUtc(): Date | undefined {
      return this.to ? endOfDayUtc(this.to, this.timezone) : undefined;
    }
  }

  return DateRangeMixin;
}
