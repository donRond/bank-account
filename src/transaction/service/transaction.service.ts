import { Injectable } from '@nestjs/common';
import { TransactionRepository } from '../repository/transaction.repository';
import {
  ConfirmTransactionDto,
  CreateTransactionDto,
  TransactionResponseDto,
} from '../dto/transaction.dto';
import { TransactionStatus } from '../enum/TransactionStatus.enum';

@Injectable()
export class TransactionService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async initiateTransfer(
    data: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionRepository.initiationTransaction(data);
  }

  async updateTransfer(
    status: TransactionStatus,
    id: string,
  ): Promise<TransactionResponseDto> {
    return await this.transactionRepository.updateTransfer(status, id);
  }

  async findTransaction({
    id,
  }: ConfirmTransactionDto): Promise<TransactionResponseDto> {
    return await this.transactionRepository.findTransaction(id);
  }

  async findTransactionReversal({
    id,
  }: ConfirmTransactionDto): Promise<TransactionResponseDto> {
    return await this.transactionRepository.findTransactionReversal(id);
  }
}
