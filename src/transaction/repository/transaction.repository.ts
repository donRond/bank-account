import { Injectable } from '@nestjs/common';
import {
  CreateTransactionDto,
  TransactionResponseDto,
} from '../dto/transaction.dto';
import { TransactionStatus } from '../enum/TransactionStatus.enum';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async initiationTransaction(
    data: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = this.prisma.$transaction(async (prisma) => {
      await prisma.transaction.create({ data });
    });
    return transaction;
  }

  async updateTransfer(
    status: TransactionStatus,
    id: string,
  ): Promise<TransactionResponseDto> {
    return await this.prisma.transaction.update({
      data: {
        status,
      },
      where: {
        id,
      },
    });
  }

  async findTransaction(id: string): Promise<TransactionResponseDto> {
    return await this.prisma.transaction.findFirst({
      where: { id },
    });
  }

  async findTransactionReversal(id: string): Promise<TransactionResponseDto> {
    return await this.prisma.transaction.findUnique({
      where: { reversedTransactionId: id },
    });
  }
}
