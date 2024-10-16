import { BadRequestException, Injectable } from '@nestjs/common';
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

  async create(payload: IcreateUserViewDto): Promise<any> {
    const emailExisted = await this.userRespository.findByEmail(payload.email);

    if (emailExisted) {
      throw new BadRequestException('Email alright register.');
    }

    if (!this.validationPassword(payload.password)) {
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
      throw new BadRequestException('Failed create account');
    }

    const account = await this.accountService.create({
      balance: new Decimal(1000),
    });

    const user = {
      ...userSuccess,
      accountId: account.id,
    };

    await this.userRespository.update(user);

    return user;
  }

  async initiateTransfer({
    sender,
    receiver,
    amount,
  }): Promise<TransactionResponseDto> {
    const creditedUser = await this.userRespository.findByEmail(receiver);

    if (sender === creditedUser.id) {
      throw new BadRequestException('You can`t transfer to yourself');
    }

    const debitedAccount = await this.userRespository.showBalance(sender);

    if (debitedAccount.balance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    const creditedAccount = await this.userRespository.showBalance(
      creditedUser.id,
    );

    await this.lockedBalance(amount, debitedAccount.id);

    const transaction = await this.transactionService.initiateTransfer({
      debitedAccountId: debitedAccount.id,
      creditedAccountId: creditedAccount.id,
      value: new Decimal(amount),
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.TRANSFER,
    });

    return transaction;
  }

  async confirmTransfer(
    payload: ConfirmTransactionDto,
    id: string,
  ): Promise<TransactionResponseDto> {
    const pendingTransaction =
      await this.transactionService.findTransaction(payload);

    if (!pendingTransaction) {
      throw new BadRequestException('Transaction not fund');
    }

    if (pendingTransaction.status === TransactionStatus.COMPLETE) {
      throw new BadRequestException('Transaction was confirm');
    }

    const debitedAccount = await this.userRespository.showBalance(id);

    if (pendingTransaction.debitedAccountId !== debitedAccount.id) {
      throw new BadRequestException('You can`t confirm this transaction');
    }

    await this.unlockedBalance(
      pendingTransaction.value,
      pendingTransaction.debitedAccountId,
    );

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

    return await this.transactionService.updateTransfer(
      TransactionStatus.COMPLETE,
      pendingTransaction.id,
    );
  }

  async reversalTransfer(
    payload: ReversalTransactionDto,
  ): Promise<TransactionResponseDto> {
    const existingTransaction =
      await this.transactionService.findTransactionReversal(payload);

    if (existingTransaction) {
      throw new BadRequestException('reversedTransactionId already exists');
    }

    const transactionCompleted =
      await this.transactionService.findTransaction(payload);

    if (transactionCompleted.status !== TransactionStatus.COMPLETE) {
      throw new BadRequestException(
        'Not possible to reversal this transaction',
      );
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

    return transaction;
  }

  async cancelTransfer(
    payload: ConfirmTransactionDto,
    id: string,
  ): Promise<TransactionResponseDto> {
    const pendingTransaction =
      await this.transactionService.findTransaction(payload);

    if (!pendingTransaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (pendingTransaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction can`t cancel');
    }

    const debitedAccount = await this.userRespository.showBalance(id);

    if (pendingTransaction.debitedAccountId !== debitedAccount.id) {
      throw new BadRequestException('You can`t cancel this transaction');
    }

    await this.unlockedBalance(
      pendingTransaction.value,
      pendingTransaction.debitedAccountId,
    );

    return await this.transactionService.updateTransfer(
      TransactionStatus.CANCELED,
      pendingTransaction.id,
    );
  }

  async listTransaction(id: string): Promise<TransactionResponseDto[]> {
    return await this.userRespository.listTransaction(id);
  }

  private async unlockedBalance(
    unlockedBalance: Decimal,
    id: string,
  ): Promise<void> {
    await this.accountService.updateLockedBalance(
      { lockedBalance: new Decimal(-unlockedBalance) },
      id,
    );
  }

  private async lockedBalance(
    lockedBalance: number,
    id: string,
  ): Promise<void> {
    await this.accountService.updateLockedBalance(
      { lockedBalance: new Decimal(lockedBalance) },
      id,
    );
  }

  async findByEmail(email: string): Promise<UserDto> {
    return await this.userRespository.findByEmail(email);
  }

  async showBalance(id: string): Promise<IAccountViewDto> {
    return await this.userRespository.showBalance(id);
  }

  private validationPassword(password: string) {
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  }
}
