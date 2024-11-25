import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../repository/user.repository';
import { AccountService } from '../../account/service/account.service';
import { TransactionService } from '../../transaction/service/transaction.service';
import { BadRequestException } from '@nestjs/common';
import { IcreateUserViewDto } from '../dto/IcreateUser.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { UserDto } from '../dto/user.dto';
import { AccountDto } from 'src/account/dto/account.dto';
import { TransactionType } from '../../transaction/enum/transactionType.enum';
import { TransactionStatus } from '../../transaction/enum/TransactionStatus.enum';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let accountService: AccountService;
  let transactionService: TransactionService;

  const payload: IcreateUserViewDto = {
    email: 'test@test.com',
    password: 'Password1',
    name: 'teste',
  };
  const createdUser: UserDto = {
    email: payload.email,
    name: payload.name,
    password: payload.password,
    role: 'USER',
    id: '1',
    accountId: '1',
    createdAt: new Date('2024-10-16T15:58:26.135Z'),
  };
  const createdAccount: AccountDto = {
    id: 'account-id',
    balance: new Decimal(100),
    lockedBalance: new Decimal(0),
    createdAt: new Date('2024-10-16T15:58:26.135Z'),
  };
  const createTransactionDto = {
    id: '123',
    debitedAccountId: 'account1',
    creditedAccountId: 'account2',
    value: new Decimal(100),
    transactionType: 'transfer',
    status: 'pending',
    createdAt: new Date('2024-10-16T15:58:26.135Z'),
  };

  const mockUserRepository = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    showBalance: jest.fn(),
    update: jest.fn(),
    listTransaction: jest.fn(),
  };

  const mockAccountService = {
    create: jest.fn(),
    updateAccountBalance: jest.fn(),
    updateLockedBalance: jest.fn(),
  };

  const mockTransactionService = {
    initiateTransfer: jest.fn(),
    updateTransfer: jest.fn(),
    findTransaction: jest.fn(),
    findTransactionReversal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AccountService, useValue: mockAccountService },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    accountService = module.get<AccountService>(AccountService);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw an error if the password is invalid', async () => {
      const payload: IcreateUserViewDto = {
        email: 'test@test.com',
        password: '12345',
        name: 'teste',
      };
      await expect(userService.create(payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a user and account successfully', async () => {
      const payload: IcreateUserViewDto = {
        email: 'test@test.com',
        password: 'Password1',
        name: 'teste',
      };
      const createdUser: UserDto = {
        email: payload.email,
        name: payload.name,
        password: payload.password,
        role: 'USER',
        id: '1',
        accountId: '1',
        createdAt: new Date('2024-10-16T15:58:26.135Z'),
      };
      const createdAccount: AccountDto = {
        id: 'account-id',
        balance: new Decimal(100),
        lockedBalance: new Decimal(0),
        createdAt: new Date('2024-10-16T15:58:26.135Z'),
      };

      jest.spyOn(userRepository, 'create').mockResolvedValue(createdUser);
      jest.spyOn(accountService, 'create').mockResolvedValue(createdAccount);
      jest
        .spyOn(userRepository, 'update')
        .mockResolvedValue({ ...createdUser, accountId: createdAccount.id });

      const result = await userService.create(payload);

      expect(result).toEqual({ ...createdUser, accountId: createdAccount.id });
    });
  });

  describe('initiateTransfer', () => {
    it('should throw an error if sender is the same as receiver', async () => {
      await expect(
        userService.initiateTransfer({
          sender: '1',
          receiver: '1',
          amount: 100,
        }),
      ).rejects.toThrow(TypeError);
    });

    it('should throw an error if sender has insufficient funds', async () => {
      const mockedAccount = { id: '1', balance: 50 };
      const receiverAccount = { id: '2', balance: 100 };

      jest
        .spyOn(userRepository, 'showBalance')
        .mockResolvedValue(createdAccount);
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(createdUser);

      await expect(
        userService.initiateTransfer({
          sender: '1',
          receiver: '2',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should initiate a transfer successfully', async () => {
      const senderAccount = { id: '3', balance: 1000 };
      const receiverAccount = { id: '2', balance: 100 };

      jest
        .spyOn(userRepository, 'showBalance')
        .mockResolvedValue(createdAccount);
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(createdUser);
      jest
        .spyOn(transactionService, 'initiateTransfer')
        .mockResolvedValue(createTransactionDto);

      const result = await userService.initiateTransfer({
        sender: '3',
        receiver: '2',
        amount: 5,
      });

      expect(result).toEqual(createTransactionDto);
    });
  });

  describe('confirmTransfer', () => {
    it('should throw an error if transaction not found', async () => {
      jest
        .spyOn(transactionService, 'findTransaction')
        .mockRejectedValue(new BadRequestException('Transaction not found'));

      await expect(
        userService.confirmTransfer(createTransactionDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if transaction is already complete', async () => {
      const completedTransactionDto = {
        id: '1',
        status: 'completa',
        debitedAccountId: 'user-id',
        creditedAccountId: 'receiver-id',
        value: new Decimal(500),
        transactionType: TransactionType.TRANSFER,
        createdAt: new Date('2024-10-16T15:58:26.135Z'),
      };

      jest
        .spyOn(transactionService, 'findTransaction')
        .mockRejectedValue(
          new BadRequestException('Transaction was already confirmed'),
        );
      jest.spyOn(userService, 'showBalance').mockResolvedValue({
        id: createTransactionDto.debitedAccountId,
        balance: new Decimal(100),
        lockedBalance: new Decimal(10.0),
      });

      await expect(
        userService.confirmTransfer(completedTransactionDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should confirm the transfer successfully', async () => {
      const pendingTransaction = {
        id: '1',
        status: 'PENDING',
        debitedAccountId: 'user-id',
        creditedAccountId: 'receiver-id',
        value: new Decimal(500),
        transactionType: TransactionType.TRANSFER,
        createdAt: new Date('2024-10-16T15:58:26.135Z'),
      };
      const debitedAccount = {
        id: 'user-id',
        balance: new Decimal(1000),
        lockedBalance: new Decimal(10.0),
      };

      jest
        .spyOn(transactionService, 'findTransaction')
        .mockResolvedValue(pendingTransaction);
      jest
        .spyOn(userRepository, 'showBalance')
        .mockResolvedValue(debitedAccount);
      jest
        .spyOn(accountService, 'updateAccountBalance')
        .mockResolvedValue(undefined);
      jest
        .spyOn(transactionService, 'updateTransfer')
        .mockResolvedValue(createTransactionDto);

      const result = await userService.confirmTransfer(
        createTransactionDto,
        'user-id',
      );

      expect(result).toEqual(createTransactionDto);
    });
  });

  describe('reversalTransfer', () => {
    it('should throw an error if reversal transaction ID already exists', async () => {
      jest
        .spyOn(transactionService, 'findTransactionReversal')
        .mockResolvedValue(createTransactionDto);

      await expect(
        userService.reversalTransfer(createTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if transaction is not complete', async () => {
      jest
        .spyOn(transactionService, 'findTransaction')
        .mockResolvedValue(createTransactionDto);

      await expect(
        userService.reversalTransfer(createTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process the reversal successfully', async () => {
      const completedTransaction = {
        id: '1',
        status: TransactionStatus.COMPLETE,
        value: new Decimal(500),
        debitedAccountId: 'debited-id',
        creditedAccountId: 'credited-id',
        transactionType: TransactionType.TRANSFER,
        createdAt: new Date('2024-10-16T15:58:26.135Z'),
      };

      jest
        .spyOn(transactionService, 'findTransaction')
        .mockResolvedValue(completedTransaction);
      jest
        .spyOn(transactionService, 'findTransactionReversal')
        .mockResolvedValue(null);
      jest
        .spyOn(accountService, 'updateAccountBalance')
        .mockResolvedValue(undefined);
      jest
        .spyOn(transactionService, 'initiateTransfer')
        .mockResolvedValue(createTransactionDto);

      const result = await userService.reversalTransfer({ id: '1' });

      expect(result).toEqual(createTransactionDto);
    });
  });

  describe('cancelTransfer', () => {
    it('should throw an error if transaction not found', async () => {
      jest
        .spyOn(transactionService, 'findTransaction')
        .mockRejectedValue(
          new BadRequestException('Transaction not found for cancellation'),
        );

      await expect(
        userService.cancelTransfer(createTransactionDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw an error if transaction is not pending', async () => {
      jest
        .spyOn(transactionService, 'findTransaction')
        .mockRejectedValue(
          new BadRequestException('Transaction can’t be canceled'),
        );

      await expect(
        userService.cancelTransfer(createTransactionDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should cancel the transfer successfully', async () => {
      const pendingTransaction = {
        id: '1',
        status: TransactionStatus.PENDING,
        debitedAccountId: 'user-id',
        creditedAccountId: 'receiver-id',
        value: new Decimal(500),
        transactionType: TransactionType.TRANSFER,
        createdAt: new Date('2024-10-16T15:58:26.135Z'),
      };
      const debitedAccount = {
        id: 'user-id',
        balance: new Decimal(1000),
        lockedBalance: new Decimal(10.0),
      };

      jest
        .spyOn(transactionService, 'findTransaction')
        .mockResolvedValue(pendingTransaction);
      jest
        .spyOn(accountService, 'updateAccountBalance')
        .mockResolvedValue(undefined);
      jest
        .spyOn(transactionService, 'updateTransfer')
        .mockResolvedValue(createTransactionDto);
      jest
        .spyOn(userRepository, 'showBalance')
        .mockResolvedValue(debitedAccount);

      const result = await userService.cancelTransfer(
        createTransactionDto,
        'user-id',
      );

      expect(result).toEqual(createTransactionDto);
    });
  });

  describe('listTransaction', () => {
    it('should return an array of transactions', async () => {
      const transactions = [
        {
          id: '1',
          status: 'PENDING',
          debitedAccountId: 'user-id',
          creditedAccountId: 'receiver-id',
          value: new Decimal(500),
          transactionType: TransactionType.TRANSFER,
          createdAt: new Date('2024-10-16T15:58:26.135Z'),
        },
      ];
      jest
        .spyOn(userRepository, 'listTransaction')
        .mockResolvedValue(transactions);

      // const result = await userService.listTransactions('user-id');
      const result = await userService.listTransactions('user-id');

      expect(result).toEqual(transactions);
    });
  });
});
