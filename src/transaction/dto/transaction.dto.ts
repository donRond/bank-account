import { PickType } from '@nestjs/mapped-types';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IsDecimal,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class IinitiationTransactionViewDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsDecimal()
  @IsNotEmpty()
  amount: Decimal;
}

// DTO base
export class TransactionDto {
  @IsUUID()
  id: string;

  debitedAccountId: string;
  creditedAccountId: string;

  @IsDecimal()
  @IsNotEmpty()
  value: Decimal;

  @IsString()
  @IsNotEmpty()
  transactionType: string;

  @IsString()
  status: string;

  createdAt: Date;
}

// DTOs para criar e atualizar
export class CreateTransactionDto extends PickType(TransactionDto, [
  'debitedAccountId',
  'creditedAccountId',
  'value',
  'transactionType',
  'status',
] as const) {
  reversedTransactionId?: string;
}

export class ConfirmTransactionDto extends PickType(TransactionDto, [
  'id',
] as const) {}

export class ReversalTransactionDto extends PickType(TransactionDto, [
  'id',
] as const) {}

export class UpdateTransactionDto extends PickType(TransactionDto, [
  'value',
  'transactionType',
  'status',
] as const) {}

export class TransactionResponseDto extends PickType(TransactionDto, [
  'id',
  'debitedAccountId',
  'creditedAccountId',
  'value',
  'transactionType',
  'status',
  'createdAt',
] as const) {
  reversedTransactionId?: string;
}
