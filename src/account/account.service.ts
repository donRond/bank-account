import { Injectable } from '@nestjs/common';
import { AccountRepository } from './repositories/account.repository';

@Injectable()
export class AccountService {
  constructor(private readonly accountRepository: AccountRepository) { }
  async create(balance: number = 100) {

    return await this.accountRepository.create({ balance });
  }
}
