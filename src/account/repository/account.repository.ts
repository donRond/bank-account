import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountDto, AccountResponseDto } from '../dto/account.dto';
import { ICreateAccountDto } from '../dto/IcreateAccount.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateAccountDto): Promise<AccountDto> {
    return await this.prisma.account.create({ data });
  }

  async updateLockedBalance(
    lockedBalance: Decimal,
    id: string,
  ): Promise<AccountResponseDto> {
    return await this.prisma.account.update({
      data: {
        lockedBalance: { increment: lockedBalance ?? 0 },
      },
      where: { id },
    });
  }

  async updateAccountBalance(
    balance: Decimal,
    id: string,
  ): Promise<AccountResponseDto> {
    return await this.prisma.account.update({
      data: {
        balance: { increment: balance ?? 0 },
      },
      where: { id },
    });
  }
}
