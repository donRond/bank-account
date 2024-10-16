import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service'; // ajuste o caminho conforme necessário
import { TransactionRepository } from '../repository/transaction.repository';
import { CreateTransactionDto, TransactionResponseDto, ConfirmTransactionDto } from '../dto/transaction.dto';
import { TransactionStatus } from '../enum/TransactionStatus.enum';
import { Decimal } from '@prisma/client/runtime/library';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let transactionRepository: TransactionRepository;

  const mockTransactionRepository = {
    initiationTransaction: jest.fn(),
    updateTransfer: jest.fn(),
    findTransaction: jest.fn(),
    findTransactionReversal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: TransactionRepository, useValue: mockTransactionRepository },
      ],
    }).compile();

    transactionService = module.get<TransactionService>(TransactionService);
    transactionRepository = module.get<TransactionRepository>(TransactionRepository);
  });

  describe('initiateTransfer', () => {
    it('should initiate a transfer and return a TransactionResponseDto', async () => {
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

      mockTransactionRepository.initiationTransaction.mockResolvedValue(expectedResponse);

      const result = await transactionService.initiateTransfer(createTransactionDto);
      expect(result).toEqual(expectedResponse);
      expect(mockTransactionRepository.initiationTransaction).toHaveBeenCalledWith(createTransactionDto);
    });
  });

  describe('updateTransfer', () => {
    it('should update a transfer and return a TransactionResponseDto', async () => {
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

      mockTransactionRepository.updateTransfer.mockResolvedValue(expectedResponse);

      const result = await transactionService.updateTransfer(status, id);
      expect(result).toEqual(expectedResponse);
      expect(mockTransactionRepository.updateTransfer).toHaveBeenCalledWith(status, id);
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

      mockTransactionRepository.findTransaction.mockResolvedValue(expectedResponse);

      const result = await transactionService.findTransaction({ id });
      expect(result).toEqual(expectedResponse);
      expect(mockTransactionRepository.findTransaction).toHaveBeenCalledWith(id);
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

      mockTransactionRepository.findTransactionReversal.mockResolvedValue(expectedResponse);

      const result = await transactionService.findTransactionReversal({ id });
      expect(result).toEqual(expectedResponse);
      expect(mockTransactionRepository.findTransactionReversal).toHaveBeenCalledWith(id);
    });
  });
});
