import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { AccountService } from './account.service';
import { AccountRepository } from '../repository/account.repository';
import { ICreateAccountDto } from '../dto/IcreateAccount.dto';
import { AccountDto, AccountResponseDto } from '../dto/account.dto';
import { UpdateAccountDto } from '../dto/Iupdate.dto';

describe('AccountService', () => {
  let service: AccountService;
  let accountRepository: AccountRepository;

  const mockAccountRepository = {
    create: jest.fn(),
    updateLockedBalance: jest.fn(),
    updateAccountBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        {
          provide: AccountRepository,
          useValue: mockAccountRepository,
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    accountRepository = module.get<AccountRepository>(AccountRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(accountRepository).toBeDefined();
  });

  describe('create', () => {
    it('should call accountRepository.create with correct values', async () => {
      // Mock data para ICreateAccountDto
      const createAccountDto: ICreateAccountDto = {
        balance: new Decimal(100),
      };

      // Mock data para AccountDto (retorno esperado)
      const expectedResult: AccountDto = {
        id: 'some-id',
        balance: new Decimal(100),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
      };

      mockAccountRepository.create.mockResolvedValue(expectedResult);

      const result = await service.create(createAccountDto);

      expect(accountRepository.create).toHaveBeenCalledWith(createAccountDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateLockedBalance', () => {
    it('should call accountRepository.updateLockedBalance with correct values', async () => {
      // Mock data para UpdateAccountDto
      const updateAccountDto: UpdateAccountDto = {
        lockedBalance: new Decimal(50),
      };
      const id = 'some-id';

      // Mock data para AccountResponseDto (retorno esperado)
      const expectedResult: AccountResponseDto = {
        id: 'some-id',
        balance: new Decimal(100),
        lockedBalance: new Decimal(50),
        createdAt: new Date(),
      };

      mockAccountRepository.updateLockedBalance.mockResolvedValue(expectedResult);

      const result = await service.updateLockedBalance(updateAccountDto, id);

      expect(accountRepository.updateLockedBalance).toHaveBeenCalledWith(updateAccountDto.lockedBalance, id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateAccountBalance', () => {
    it('should call accountRepository.updateAccountBalance with correct values', async () => {
      // Mock data para UpdateAccountDto
      const updateAccountDto: UpdateAccountDto = {
        balance: new Decimal(200),
      };
      const id = 'some-id';

      // Mock data para AccountResponseDto (retorno esperado)
      const expectedResult: AccountResponseDto = {
        id: 'some-id',
        balance: new Decimal(200),
        lockedBalance: new Decimal(0),
        createdAt: new Date(),
      };

      mockAccountRepository.updateAccountBalance.mockResolvedValue(expectedResult);

      const result = await service.updateAccountBalance(updateAccountDto, id);

      expect(accountRepository.updateAccountBalance).toHaveBeenCalledWith(updateAccountDto.balance, id);
      expect(result).toEqual(expectedResult);
    });
  });
});