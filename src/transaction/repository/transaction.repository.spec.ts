import { Test, TestingModule } from '@nestjs/testing';
import { TransactionRepository } from './transaction.repository'; // ajuste o caminho conforme necessário
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTransactionDto,
  TransactionResponseDto,
} from '../dto/transaction.dto';
import { TransactionStatus } from '../enum/TransactionStatus.enum';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transaction: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    transactionRepository = module.get<TransactionRepository>(
      TransactionRepository,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('initiationTransaction', () => {
    it('should create a transaction and return a TransactionResponseDto', async () => {
      const createTransactionDto: CreateTransactionDto = {
        debitedAccountId: 'account1',
        creditedAccountId: 'account2',
        value: new Decimal(100),
        transactionType: 'transfer',
        status: 'pending',
      };
      const expectedResponse: TransactionResponseDto = {
        id: '1',
        debitedAccountId: 'account1',
        creditedAccountId: 'account2',
        value: new Decimal(100),
        transactionType: 'transfer',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrismaService.transaction.create.mockResolvedValue(expectedResponse);

      const result =
        await transactionRepository.initiationTransaction(createTransactionDto);
      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: createTransactionDto,
      });
    });
  });

  describe('updateTransfer', () => {
    it('should update a transaction status and return a TransactionResponseDto', async () => {
      const status = TransactionStatus.COMPLETE;
      const id = '1';
      const expectedResponse: TransactionResponseDto = {
        id: '1',
        debitedAccountId: 'account1',
        creditedAccountId: 'account2',
        value: new Decimal(100),
        transactionType: 'transfer',
        status: 'completed',
        createdAt: new Date(),
      };

      mockPrismaService.transaction.update.mockResolvedValue(expectedResponse);

      const result = await transactionRepository.updateTransfer(status, id);
      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
        data: { status },
        where: { id },
      });
    });
  });

  describe('findTransaction', () => {
    it('should find a transaction by id and return a TransactionResponseDto', async () => {
      const id = '1';
      const expectedResponse: TransactionResponseDto = {
        id: '1',
        debitedAccountId: 'account1',
        creditedAccountId: 'account2',
        value: new Decimal(100),
        transactionType: 'transfer',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrismaService.transaction.findFirst.mockResolvedValue(
        expectedResponse,
      );

      const result = await transactionRepository.findTransaction(id);
      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.transaction.findFirst).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('findTransactionReversal', () => {
    it('should find a transaction reversal by id and return a TransactionResponseDto', async () => {
      const id = '1';
      const expectedResponse: TransactionResponseDto = {
        id: '1',
        debitedAccountId: 'account1',
        creditedAccountId: 'account2',
        value: new Decimal(100),
        transactionType: 'transfer',
        status: 'reversed',
        createdAt: new Date(),
      };

      mockPrismaService.transaction.findUnique.mockResolvedValue(
        expectedResponse,
      );

      const result = await transactionRepository.findTransactionReversal(id);
      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { reversedTransactionId: '1' },
      });
    });
  });
});
