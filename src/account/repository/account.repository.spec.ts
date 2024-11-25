import { Test, TestingModule } from '@nestjs/testing';
import { AccountRepository } from './account.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { ICreateAccountDto } from '../dto/IcreateAccount.dto';
import { AccountDto, AccountResponseDto } from '../dto/account.dto';
import { Decimal } from '@prisma/client/runtime/library';

// Criando um mock do PrismaService
const mockPrismaService = {
  account: {
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('AccountRepository', () => {
  let accountRepository: AccountRepository;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    accountRepository = module.get<AccountRepository>(AccountRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Limpa os mocks após cada teste
  });

  describe('create', () => {
    it('should create an account and return the account DTO', async () => {
      const accountData: ICreateAccountDto = { balance: new Decimal(100) }; // Ajuste conforme seu DTO
      const expectedAccount: AccountDto = {
        id: '1',
        ...accountData,
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
      };

      mockPrismaService.account.create.mockResolvedValue(expectedAccount);

      const result = await accountRepository.create(accountData);

      expect(result).toEqual(expectedAccount);
      expect(mockPrismaService.account.create).toHaveBeenCalledWith({
        data: accountData,
      });
      expect(mockPrismaService.account.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateLockedBalance', () => {
    it('should update the locked balance of the account and return the account response DTO', async () => {
      const id = '1';
      const lockedBalance = new Decimal(50);
      const expectedResponse: AccountResponseDto = {
        id,
        balance: new Decimal(100),
        lockedBalance: new Decimal(50),
        createdAt: new Date(),
      };

      mockPrismaService.account.update.mockResolvedValue(expectedResponse);

      const result = await accountRepository.updateLockedBalance(
        lockedBalance,
        id,
      );

      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        data: {
          lockedBalance: { increment: lockedBalance },
        },
        where: { id },
      });
      expect(mockPrismaService.account.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateAccountBalance', () => {
    it('should update the account balance and return the account response DTO', async () => {
      const id = '1';
      const balance = new Decimal(150);
      const expectedResponse: AccountResponseDto = {
        id,
        balance: new Decimal(250),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
      };

      mockPrismaService.account.update.mockResolvedValue(expectedResponse);

      const result = await accountRepository.updateAccountBalance(balance, id);

      expect(result).toEqual(expectedResponse);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        data: {
          balance: { increment: balance },
        },
        where: { id },
      });
      expect(mockPrismaService.account.update).toHaveBeenCalledTimes(1);
    });
  });
});
