import { Injectable, Logger } from '@nestjs/common';
import { AccountRepository } from '../repository/account.repository';
import { ICreateAccountDto } from '../dto/IcreateAccount.dto';
import { AccountDto, AccountResponseDto } from '../dto/account.dto';
import { UpdateAccountDto } from '../dto/Iupdate.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly accountRepositorty: AccountRepository) {}

  async create(data: ICreateAccountDto): Promise<AccountDto> {
    this.logger.log('Creating account with data: ' + JSON.stringify(data));
    
    const account = await this.accountRepositorty.create(data);
    this.logger.log('Account created successfully: ' + JSON.stringify(account));
    
    return account;
  }

  async updateLockedBalance(
    { lockedBalance }: UpdateAccountDto,
    id: string,
  ): Promise<AccountResponseDto> {
    this.logger.log(`Updating locked balance for account ID: ${id} with value: ${lockedBalance}`);
    
    const updatedAccount = await this.accountRepositorty.updateLockedBalance(lockedBalance, id);
    this.logger.log('Locked balance updated successfully: ' + JSON.stringify(updatedAccount));
    
    return updatedAccount;
  }

  async updateAccountBalance(
    { balance }: UpdateAccountDto,
    id: string,
  ): Promise<AccountResponseDto> {
    this.logger.log(`Updating account balance for account ID: ${id} with value: ${balance}`);
    
    const updatedAccount = await this.accountRepositorty.updateAccountBalance(balance, id);
    this.logger.log('Account balance updated successfully: ' + JSON.stringify(updatedAccount));
    
    return updatedAccount;
  }
}
