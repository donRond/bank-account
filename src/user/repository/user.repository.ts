import { Injectable } from '@nestjs/common';
import { IcreateUserViewDto } from '../dto/IcreateUser.dto';
import { IUpdateUserDto } from '../dto/IupdateUser.dto';
import { UserDto } from '../dto/user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { IAccountViewDto } from 'src/account/dto/IcreateAccount.dto';
import { TransactionResponseDto } from 'src/transaction/dto/transaction.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: IcreateUserViewDto): Promise<UserDto> {
    return await this.prisma.user.create({
      data,
    });
  }

  async showBalance(id: string): Promise<IAccountViewDto> {
    const { account } = await this.prisma.user.findUnique({
      where: { id },
      select: { account: { select: { balance: true, id: true } } },
    });
    return account;
  }

  async update(data: IUpdateUserDto): Promise<UserDto> {
    return await this.prisma.user.update({
      data,
      where: {
        email: data.email,
      },
    });
  }

  async findByEmail(email: string): Promise<UserDto> {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async listTransaction(id: string): Promise<TransactionResponseDto[]> {
    const transaction = await this.prisma.user.findUnique({
      where: { id },
      select: {
        account: {
          include: {
            debitedTransactions: true,
            creditedTransactions: true,
          },
        },
      },
    });

    const { debitedTransactions, creditedTransactions } = transaction.account;
    const allTransactions = [...debitedTransactions, ...creditedTransactions];

    return allTransactions;
  }
}
