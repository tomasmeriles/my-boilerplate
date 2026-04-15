import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { WithSort } from '../../../common/dto/sort-query.dto';
import { USER_SORT_FIELDS } from '../constants/user.constants';

export class UsersQueryDto extends WithSort(
  USER_SORT_FIELDS,
  PaginationQueryDto,
) {
  @IsOptional()
  @IsString()
  search?: string;
}
