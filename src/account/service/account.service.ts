import { Injectable } from '@nestjs/common';
import { AccountRepository } from '../repository/account.repository';
import { ICreateAccountDto } from '../dto/IcreateAccount.dto';
import { AccountDto, AccountResponseDto } from '../dto/account.dto';
import { UpdateAccountDto } from '../dto/Iupdate.dto';

@Injectable()
export class AccountService {
  constructor(private readonly accountRepositorty: AccountRepository) {}

  async create(data: ICreateAccountDto): Promise<AccountDto> {
    return await this.accountRepositorty.create(data);
  }

  async updateLockedBalance(
    { lockedBalance }: UpdateAccountDto,
    id: string,
  ): Promise<AccountResponseDto> {
    return await this.accountRepositorty.updateLockedBalance(lockedBalance, id);
  }

  async updateAccountBalance(
    { balance }: UpdateAccountDto,
    id: string,
  ): Promise<AccountResponseDto> {
    return await this.accountRepositorty.updateAccountBalance(balance, id);
  }
}
