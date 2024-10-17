import { Injectable, Logger } from '@nestjs/common';
import { AccountRepository } from '../repository/account.repository';
import { ICreateAccountDto } from '../dto/IcreateAccount.dto';
import { AccountDto, AccountResponseDto } from '../dto/account.dto';
import { UpdateAccountDto } from '../dto/Iupdate.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly accountRepository: AccountRepository) {}

  async create(data: ICreateAccountDto): Promise<AccountDto> {
    this.logger.log(`Creating account with data: ${JSON.stringify(data)}`);

    try {
      const account = await this.accountRepository.create(data);
      this.logger.log(`Account created successfully: ${JSON.stringify(account)}`);
      return account;
    } catch (error) {
      this.logger.error(`Failed to create account: ${error.message}`);
      throw error; // Rethrow the error for further handling
    }
  }

  async updateLockedBalance(
    { lockedBalance }: UpdateAccountDto,
    id: string,
  ): Promise<AccountResponseDto> {
    this.logger.log(`Updating locked balance for account ID: ${id} with value: ${lockedBalance}`);

    try {
      const updatedAccount = await this.accountRepository.updateLockedBalance(lockedBalance, id);
      this.logger.log(`Locked balance updated successfully: ${JSON.stringify(updatedAccount)}`);
      return updatedAccount;
    } catch (error) {
      this.logger.error(`Failed to update locked balance for account ID ${id}: ${error.message}`);
      throw error; // Rethrow the error for further handling
    }
  }

  async updateAccountBalance(
    { balance }: UpdateAccountDto,
    id: string,
  ): Promise<AccountResponseDto> {
    this.logger.log(`Updating account balance for account ID: ${id} with value: ${balance}`);

    try {
      const updatedAccount = await this.accountRepository.updateAccountBalance(balance, id);
      this.logger.log(`Account balance updated successfully: ${JSON.stringify(updatedAccount)}`);
      return updatedAccount;
    } catch (error) {
      this.logger.error(`Failed to update account balance for account ID ${id}: ${error.message}`);
      throw error; // Rethrow the error for further handling
    }
  }
}
