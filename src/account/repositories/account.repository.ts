import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateAccountDto } from "../dto/create-account.dto";
import { AccountEntity } from "../entities/account.entity";

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(createAccountDto: CreateAccountDto): Promise<AccountEntity> {
    return await this.prisma.account.create({
      data: {
        balance: createAccountDto.balance
      }
    })
  }
} 
