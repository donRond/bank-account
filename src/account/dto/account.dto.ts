import { PickType } from '@nestjs/mapped-types';
import { Decimal } from '@prisma/client/runtime/library';
import { IsDecimal, IsEmpty, IsNotEmpty } from 'class-validator';

export class AccountDto {
  id: string;

  @IsDecimal()
  @IsNotEmpty()
  balance: Decimal;

  @IsDecimal()
  @IsEmpty()
  lockedBalance: Decimal;

  createdAt: Date;
}

export class AccountResponseDto extends PickType(AccountDto, [
  'id',
  'balance',
  'lockedBalance',
  'createdAt',
] as const) {}
