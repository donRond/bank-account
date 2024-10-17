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
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
  ) {}

  async create(userData: IcreateUserViewDto): Promise<UserDto> {
    this.logger.log('Creating a new user...');

    await this.validateEmail(userData.email);
    this.validatePassword(userData.password);

    const hashedPassword = await this.hashPassword(userData.password);
    const createdUser = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    if (!createdUser.email) {
      throw new BadRequestException('Failed to create user account');
    }

    this.logger.log('User created successfully: ' + createdUser.email);

    const account = await this.createAccount();
    const updatedUser = await this.linkAccountToUser(createdUser, account.id);
    return updatedUser;
  }

  private async validateEmail(email: string): Promise<void> {
    const emailExists = await this.userRepository.findByEmail(email);
    if (emailExists) {
      this.logger.error('Email already registered: ' + email);
      throw new BadRequestException('Email already registered.');
    }
  }

  private validatePassword(password: string): void {
    const isValid =
      password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
    if (!isValid) {
      this.logger.error('Password validation failed.');
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase letters and numbers.',
      );
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }

  private async createAccount(): Promise<any> {
    return this.accountService.create({ balance: new Decimal(1000) });
  }

  private async linkAccountToUser(
    user: any,
    accountId: string,
  ): Promise<UserDto> {
    const updatedUser = { ...user, accountId };
    await this.userRepository.update(updatedUser);
    this.logger.log('User account linked with ID: ' + accountId);
    return updatedUser;
  }

  async showBalance(id: string): Promise<IAccountViewDto> {
    return await this.userRepository.showBalance(id);
  }

  async initiateTransfer({
    sender,
    receiver,
    amount,
  }): Promise<TransactionResponseDto> {
    this.logger.log(
      `Initiating transfer from ${sender} to ${receiver} for amount ${amount}...`,
    );

    const receiverAccount = await this.userRepository.findByEmail(receiver);
    if (sender === receiverAccount.id) {
      throw new BadRequestException('You can’t transfer to yourself');
    }

    const senderAccount = await this.showBalance(sender);
    this.validateSufficientFunds(
      senderAccount.balance,
      senderAccount.lockedBalance,
      amount,
    );

    await this.lockBalance(amount, senderAccount.id);

    const transaction = await this.transactionService.initiateTransfer({
      debitedAccountId: senderAccount.id,
      creditedAccountId: receiverAccount.accountId,
      value: new Decimal(amount),
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.TRANSFER,
    });

    this.logger.log(
      'Transfer initiated successfully: ' + JSON.stringify(transaction),
    );
    return transaction;
  }

  private validateSufficientFunds(
    balance: Decimal,
    lockedBalance: Decimal,
    amount: Decimal,
  ): void {
    if (balance.sub(lockedBalance).lt(amount)) {
      throw new BadRequestException('Insufficient funds to lockedBalance');
    }
  }

  async confirmTransfer(
    payload: ConfirmTransactionDto,
    userId: string,
  ): Promise<TransactionResponseDto> {
    this.logger.log(
      'Confirming transfer for transaction: ' + JSON.stringify(payload),
    );

    const transaction = await this.transactionService.findTransaction(payload);
    this.validateTransactionForConfirmation(transaction, userId);

    await this.updateBalancesForTransfer(transaction);
    const updatedTransaction = await this.transactionService.updateTransfer(
      TransactionStatus.COMPLETE,
      transaction.id,
    );

    this.logger.log(
      'Transfer confirmed successfully: ' + JSON.stringify(updatedTransaction),
    );
    return updatedTransaction;
  }

  private async validateTransactionForConfirmation(
    transaction: TransactionResponseDto,
    userId: string,
  ): Promise<void> {
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status === TransactionStatus.COMPLETE) {
      throw new BadRequestException('Transaction was already confirmed');
    }

    const { id } = await this.showBalance(userId);
    if (transaction.debitedAccountId !== id) {
      this.logger.log(
        `account debite ${transaction.debitedAccountId} e userId ${userId}`,
      );
      throw new BadRequestException('You can’t confirm this transaction');
    }
  }

  private async updateBalancesForTransfer(transaction: any): Promise<void> {
    await this.unlockBalance(transaction.value, transaction.debitedAccountId);
    await this.accountService.updateAccountBalance(
      { balance: new Decimal(-transaction.value) },
      transaction.debitedAccountId,
    );
    await this.accountService.updateAccountBalance(
      { balance: transaction.value },
      transaction.creditedAccountId,
    );
  }

  async reversalTransfer(
    payload: ReversalTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(
      'Initiating reversal for transaction: ' + JSON.stringify(payload),
    );

    const existingTransaction =
      await this.transactionService.findTransactionReversal(payload);
    if (existingTransaction) {
      throw new BadRequestException('Reversed transaction ID already exists');
    }

    const completedTransaction =
      await this.transactionService.findTransaction(payload);
    if (completedTransaction.status !== TransactionStatus.COMPLETE) {
      throw new BadRequestException('Not possible to reverse this transaction');
    }

    await this.updateBalancesForReversal(completedTransaction);

    const reversalTransaction = await this.transactionService.initiateTransfer({
      debitedAccountId: completedTransaction.creditedAccountId,
      creditedAccountId: completedTransaction.debitedAccountId,
      reversedTransactionId: completedTransaction.id,
      value: completedTransaction.value,
      status: TransactionStatus.COMPLETE,
      transactionType: TransactionType.REVERSAL,
    });

    this.logger.log(
      'Reversal completed successfully: ' + JSON.stringify(reversalTransaction),
    );
    return reversalTransaction;
  }

  private async updateBalancesForReversal(transaction: any): Promise<void> {
    await this.accountService.updateAccountBalance(
      { balance: transaction.value },
      transaction.debitedAccountId,
    );
    await this.accountService.updateAccountBalance(
      { balance: new Decimal(-transaction.value) },
      transaction.creditedAccountId,
    );
  }

  async cancelTransfer(
    payload: ConfirmTransactionDto,
    userId: string,
  ): Promise<TransactionResponseDto> {
    this.logger.log(
      'Cancelling transfer for transaction: ' + JSON.stringify(payload),
    );

    const transaction = await this.transactionService.findTransaction(payload);
    this.validateTransactionForCancellation(transaction, userId);

    await this.unlockBalance(transaction.value, transaction.debitedAccountId);
    const updatedTransaction = await this.transactionService.updateTransfer(
      TransactionStatus.CANCELED,
      transaction.id,
    );

    this.logger.log(
      'Transfer canceled successfully: ' + JSON.stringify(updatedTransaction),
    );
    return updatedTransaction;
  }

  private async validateTransactionForCancellation(
    transaction: any,
    userId: string,
  ): Promise<void> {
    if (!transaction) {
      throw new BadRequestException('Transaction not found for cancellation');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction can’t be canceled');
    }
    const { id } = await this.showBalance(userId);
    if (transaction.debitedAccountId !== id) {
      throw new BadRequestException('You can’t cancel this transaction');
    }
  }

  async listTransactions(userId: string): Promise<TransactionResponseDto[]> {
    this.logger.log('Listing transactions for user ID: ' + userId);
    return await this.userRepository.listTransaction(userId);
  }

  private async unlockBalance(
    unlockedBalance: Decimal,
    accountId: string,
  ): Promise<void> {
    this.logger.log('Unlocking balance for account ID: ' + accountId);
    await this.accountService.updateLockedBalance(
      { lockedBalance: new Decimal(-unlockedBalance) },
      accountId,
    );
  }

  private async lockBalance(
    lockedBalance: number,
    accountId: string,
  ): Promise<void> {
    this.logger.log('Locking balance for account ID: ' + accountId);

    await this.accountService.updateLockedBalance(
      { lockedBalance: new Decimal(lockedBalance) },
      accountId,
    );
  }
}
