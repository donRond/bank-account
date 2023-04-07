import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountService } from './account.service';
import { AccountRepository } from './repositories/account.repository';

@Module({
  controllers: [],
  providers: [AccountService, AccountRepository, PrismaService]
})
export class AccountModule { }
