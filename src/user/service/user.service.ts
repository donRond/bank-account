import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IcreateUserViewDto } from '../dto/IcreateUser.dto';
import { UserRepository } from '../repository/user.repository';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';
import { UserDto } from '../dto/user.dto';

import { IAccountViewDto } from '../../account/dto/IcreateAccount.dto';
import { TransactionService } from '../../transaction/service/transaction.service';
import { TransactionStatus } from '../../transaction/enum/TransactionStatus.enum';
import { TransactionType } from '../../transaction/enum/transactionType.enum';
import {
  ConfirmTransactionDto,
  ReversalTransactionDto,
  TransactionResponseDto,
} from '../../transaction/dto/transaction.dto';
import { AccountService } from '../../account/service/account.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRespository: UserRepository,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async create(payload: IcreateUserViewDto): Promise<any> {
    this.logger.log('Creating a new user...');
    
    const emailExisted = await this.userRespository.findByEmail(payload.email);
    if (emailExisted) {
      this.logger.error('Email already registered: ' + payload.email);
      throw new BadRequestException('Email already registered.');
    }

    if (!this.validationPassword(payload.password)) {
      this.logger.error('Password validation failed for email: ' + payload.email);
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase letters and numbers.',
      );
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(payload.password, salt);

    const data = {
      ...payload,
      password,
    };

    const userSuccess = await this.userRespository.create(data);
    if (!userSuccess.email) {
      this.logger.error('Failed to create user account: ' + JSON.stringify(userSuccess));
      throw new BadRequestException('Failed to create account');
    }

    this.logger.log('User created successfully: ' + userSuccess.email);
    const account = await this.accountService.create({
      balance: new Decimal(1000),
    });

    const user = {
      ...userSuccess,
      accountId: account.id,
    };

    await this.userRespository.update(user);

    this.logger.log('User account linked with ID: ' + account.id);
    return user;
  }

  async initiateTransfer({
    sender,
    receiver,
    amount,
  }): Promise<TransactionResponseDto> {
    this.logger.log(`Initiating transfer from ${sender} to ${receiver} for amount ${amount}...`);
    
    const creditedUser = await this.userRespository.findByEmail(receiver);
    if (sender === creditedUser.id) {
      this.logger.error('User cannot transfer to themselves: ' + sender);
      throw new BadRequestException('You can`t transfer to yourself');
    }

    const debitedAccount = await this.userRespository.showBalance(sender);
    if (debitedAccount.balance < amount) {
      this.logger.error(`Insufficient funds for user ${sender}: current balance ${debitedAccount.balance}, attempted transfer ${amount}`);
      throw new BadRequestException('Insufficient funds');
    }

    const creditedAccount = await this.userRespository.showBalance(creditedUser.id);
    await this.lockedBalance(amount, debitedAccount.id);

    const transaction = await this.transactionService.initiateTransfer({
      debitedAccountId: debitedAccount.id,
      creditedAccountId: creditedAccount.id,
      value: new Decimal(amount),
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.TRANSFER,
    });

    this.logger.log('Transfer initiated successfully: ' + JSON.stringify(transaction));
    return transaction;
  }

  async confirmTransfer(
    payload: ConfirmTransactionDto,
    id: string,
  ): Promise<TransactionResponseDto> {
    this.logger.log('Confirming transfer for transaction: ' + JSON.stringify(payload));

    const pendingTransaction = await this.transactionService.findTransaction(payload);
    if (!pendingTransaction) {
      this.logger.error('Transaction not found: ' + JSON.stringify(payload));
      throw new BadRequestException('Transaction not found');
    }

    if (pendingTransaction.status === TransactionStatus.COMPLETE) {
      this.logger.error('Transaction already confirmed: ' + pendingTransaction.id);
      throw new BadRequestException('Transaction was confirmed');
    }

    const debitedAccount = await this.userRespository.showBalance(id);
    if (pendingTransaction.debitedAccountId !== debitedAccount.id) {
      this.logger.error('User cannot confirm this transaction: ' + id);
      throw new BadRequestException('You can`t confirm this transaction');
    }

    await this.unlockedBalance(pendingTransaction.value, pendingTransaction.debitedAccountId);
    await this.accountService.updateAccountBalance(
      {
        balance: new Decimal(-pendingTransaction.value),
      },
      pendingTransaction.debitedAccountId,
    );
    await this.accountService.updateAccountBalance(
      {
        balance: pendingTransaction.value,
      },
      pendingTransaction.creditedAccountId,
    );

    const updatedTransaction = await this.transactionService.updateTransfer(
      TransactionStatus.COMPLETE,
      pendingTransaction.id,
    );
    
    this.logger.log('Transfer confirmed successfully: ' + JSON.stringify(updatedTransaction));
    return updatedTransaction;
  }

  async reversalTransfer(
    payload: ReversalTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log('Initiating reversal for transaction: ' + JSON.stringify(payload));

    const existingTransaction = await this.transactionService.findTransactionReversal(payload);
    if (existingTransaction) {
      this.logger.error('Reversal transaction already exists: ' + existingTransaction.id);
      throw new BadRequestException('reversedTransactionId already exists');
    }

    const transactionCompleted = await this.transactionService.findTransaction(payload);
    if (transactionCompleted.status !== TransactionStatus.COMPLETE) {
      this.logger.error('Not possible to reverse this transaction: ' + transactionCompleted.id);
      throw new BadRequestException('Not possible to reverse this transaction');
    }

    await this.accountService.updateAccountBalance(
      { balance: transactionCompleted.value },
      transactionCompleted.debitedAccountId,
    );

    await this.accountService.updateAccountBalance(
      { balance: new Decimal(-transactionCompleted.value) },
      transactionCompleted.creditedAccountId,
    );

    const transaction = await this.transactionService.initiateTransfer({
      debitedAccountId: transactionCompleted.creditedAccountId,
      creditedAccountId: transactionCompleted.debitedAccountId,
      reversedTransactionId: transactionCompleted.id,
      value: transactionCompleted.value,
      status: TransactionStatus.COMPLETE,
      transactionType: TransactionType.REVERSAL,
    });

    this.logger.log('Reversal completed successfully: ' + JSON.stringify(transaction));
    return transaction;
  }

  async cancelTransfer(
    payload: ConfirmTransactionDto,
    id: string,
  ): Promise<TransactionResponseDto> {
    this.logger.log('Cancelling transfer for transaction: ' + JSON.stringify(payload));

    const pendingTransaction = await this.transactionService.findTransaction(payload);
    if (!pendingTransaction) {
      this.logger.error('Transaction not found for cancellation: ' + JSON.stringify(payload));
      throw new BadRequestException('Transaction not found');
    }

    if (pendingTransaction.status !== TransactionStatus.PENDING) {
      this.logger.error('Transaction cannot be canceled: ' + pendingTransaction.id);
      throw new BadRequestException('Transaction can`t be canceled');
    }

    const debitedAccount = await this.userRespository.showBalance(id);
    if (pendingTransaction.debitedAccountId !== debitedAccount.id) {
      this.logger.error('User cannot cancel this transaction: ' + id);
      throw new BadRequestException('You can`t cancel this transaction');
    }

    await this.unlockedBalance(pendingTransaction.value, pendingTransaction.debitedAccountId);
    const updatedTransaction = await this.transactionService.updateTransfer(
      TransactionStatus.CANCELED,
      pendingTransaction.id,
    );

    this.logger.log('Transfer canceled successfully: ' + JSON.stringify(updatedTransaction));
    return updatedTransaction;
  }

  async listTransaction(id: string): Promise<TransactionResponseDto[]> {
    this.logger.log('Listing transactions for user ID: ' + id);
    return await this.userRespository.listTransaction(id);
  }

  private async unlockedBalance(
    unlockedBalance: Decimal,
    id: string,
  ): Promise<void> {
    this.logger.log('Unlocking balance for account ID: ' + id);
    await this.accountService.updateLockedBalance(
      { lockedBalance: new Decimal(-unlockedBalance) },
      id,
    );
  }

  private async lockedBalance(
    lockedBalance: number,
    id: string,
  ): Promise<void> {
    this.logger.log('Locking balance for account ID: ' + id);
    await this.accountService.updateLockedBalance(
      { lockedBalance: new Decimal(lockedBalance) },
      id,
    );
  }

  async findByEmail(email: string): Promise<UserDto> {
    this.logger.log('Finding user by email: ' + email);
    return await this.userRespository.findByEmail(email);
  }

  async showBalance(id: string): Promise<IAccountViewDto> {
    this.logger.log('Showing balance for account ID: ' + id);
    return await this.userRespository.showBalance(id);
  }

  private validationPassword(password: string): boolean {
    this.logger.log('Validating password...');
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password)
    );
  }
}
