import { Injectable, Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(TransactionService.name);
  
  async initiateTransfer(
    data: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log('Initiating transfer with data: ' + JSON.stringify(data));
    
    const transaction = await this.transactionRepository.initiationTransaction(data);
    this.logger.log('Transfer initiated successfully: ' + JSON.stringify(transaction));
    
    return transaction;
  }

  async updateTransfer(
    status: TransactionStatus,
    id: string,
  ): Promise<TransactionResponseDto> {
    this.logger.log(`Updating transaction status to ${status} for ID: ${id}`);
    
    const updatedTransaction = await this.transactionRepository.updateTransfer(status, id);
    this.logger.log('Transaction updated successfully: ' + JSON.stringify(updatedTransaction));
    
    return updatedTransaction;
  }

  async findTransaction({
    id,
  }: ConfirmTransactionDto): Promise<TransactionResponseDto> {
    this.logger.log('Finding transaction with ID: ' + id);
    
    const transaction = await this.transactionRepository.findTransaction(id);
    this.logger.log('Transaction found: ' + JSON.stringify(transaction));
    
    return transaction;
  }

  async findTransactionReversal({
    id,
  }: ConfirmTransactionDto): Promise<TransactionResponseDto> {
    this.logger.log('Finding transaction reversal for ID: ' + id);
    
    const transactionReversal = await this.transactionRepository.findTransactionReversal(id);
    this.logger.log('Transaction reversal found: ' + JSON.stringify(transactionReversal));
    
    return transactionReversal;
  }
}
