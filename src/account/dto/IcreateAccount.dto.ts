import { PickType } from '@nestjs/mapped-types';
import { AccountDto } from './account.dto';

export class ICreateAccountDto extends PickType(AccountDto, [
  'balance',
] as const) {}

export class IAccountViewDto extends PickType(AccountDto, [
  'id',
  'balance',
] as const) {}
