import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountRepository } from 'src/account/repositories/account.repository';
import { AccountService } from 'src/account/account.service';

@Module({
  providers: [UserService, UserRepository, PrismaService, AccountRepository, AccountService],
  controllers: [UserController]
})
export class UserModule { }
