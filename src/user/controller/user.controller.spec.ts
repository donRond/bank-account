import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { IinitiationTransactionViewDto, ConfirmTransactionDto, ReversalTransactionDto, TransactionResponseDto } from '../../transaction/dto/transaction.dto';
import { IAccountViewDto } from '../../account/dto/IcreateAccount.dto';
import { Request } from 'express';
import { Decimal } from '@prisma/client/runtime/library';

// Mock do UserService
const mockUserService = {
  initiateTransfer: jest.fn(),
  confirmTransfer: jest.fn(),
  reversalTransfer: jest.fn(),
  cancelTransfer: jest.fn(),
  listTransactions: jest.fn(),
  showBalance: jest.fn(),
};

// Mock de dados
const mockTransactionResponse: TransactionResponseDto = {
  id: 'b0f7e57d-1234-5678-9101-abcdef123456',
  debitedAccountId: 'debited-account-id',
  creditedAccountId: 'credited-account-id',
  value: new Decimal(200.00),
  transactionType: 'transfer',
  status: 'confirmed',
  createdAt: new Date(),
};

const mockAccountView: IAccountViewDto = {
  id: 'account-id',
  balance: new Decimal(500.00),
  lockedBalance:new Decimal(100.00),
};

describe('UserController', () => {
  let userController: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(AuthGuard) // Ignorar o AuthGuard para os testes
      .useValue({
        canActivate: jest.fn(() => true), // Simulando que o guard sempre permite acesso
      })
      .overrideGuard(RoleGuard) // Ignorar o RoleGuard para os testes
      .useValue({
        canActivate: jest.fn(() => true), // Simulando que o guard sempre permite acesso
      })
      .compile();

    userController = module.get<UserController>(UserController);
  });

  describe('createTransfer', () => {
    it('deve iniciar uma transferência', async () => {
      const request = { user: { id: 'user-id' } } as unknown as Request;
      const payload: IinitiationTransactionViewDto = {
        email: 'receiver@example.com',
        amount: new Decimal(100.00),
      };
      mockUserService.initiateTransfer.mockResolvedValue(mockTransactionResponse);

      const result = await userController.createTransfer(request, payload);

      expect(result).toEqual(mockTransactionResponse);
      expect(mockUserService.initiateTransfer).toHaveBeenCalledWith({
        sender: 'user-id',
        receiver: 'receiver@example.com',
        amount: new Decimal(100.00),
      });
    });
  });

  describe('confirmTransfer', () => {
    it('deve confirmar uma transferência', async () => {
      const request = { user: { id: 'user-id' } } as unknown as Request;
      const payload: ConfirmTransactionDto = { id: 'transaction-id' };
      mockUserService.confirmTransfer.mockResolvedValue(mockTransactionResponse);

      const result = await userController.confirmTransfer(request, payload);

      expect(result).toEqual(mockTransactionResponse);
      expect(mockUserService.confirmTransfer).toHaveBeenCalledWith(payload, 'user-id');
    });
  });

  describe('reverselTransfer', () => {
    it('deve reverter uma transferência', async () => {
      const payload: ReversalTransactionDto = { id: 'transaction-id' };
      mockUserService.reversalTransfer.mockResolvedValue(mockTransactionResponse);

      const result = await userController.reverselTransfer(payload);

      expect(result).toEqual(mockTransactionResponse);
      expect(mockUserService.reversalTransfer).toHaveBeenCalledWith(payload);
    });
  });

  describe('cancelTransfer', () => {
    it('deve cancelar uma transferência', async () => {
      const request = { user: { id: 'user-id' } } as unknown as Request;
      const payload: ReversalTransactionDto = { id: 'transaction-id' };
      mockUserService.cancelTransfer.mockResolvedValue(mockTransactionResponse);

      const result = await userController.cancelTransfer(request, payload);

      expect(result).toEqual(mockTransactionResponse);
      expect(mockUserService.cancelTransfer).toHaveBeenCalledWith(payload, 'user-id');
    });
  });

  describe('listTransaction', () => {
    it('deve listar as transações', async () => {
      const request = { user: { id: 'user-id' } } as unknown as Request;
      mockUserService.listTransactions.mockResolvedValue([mockTransactionResponse]);

      const result = await userController.listTransaction(request);

      expect(result).toEqual([mockTransactionResponse]);
      expect(mockUserService.listTransactions).toHaveBeenCalledWith('user-id');
    });
  });

  describe('showBalance', () => {
    it('deve mostrar o saldo', async () => {
      const request = { user: { id: 'user-id' } } as unknown as Request;
      mockUserService.showBalance.mockResolvedValue(mockAccountView);

      const result = await userController.showBalance(request);

      expect(result).toEqual(mockAccountView);
      expect(mockUserService.showBalance).toHaveBeenCalledWith('user-id');
    });
  });
});
