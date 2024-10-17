import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service'; // ajuste o caminho conforme necessário
import { UserService } from '../../user/service/user.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import { ILoginDto } from '../dto/Ilogin.dto';
import * as bcrypt from 'bcrypt';
import { AccessToken } from '../dto/accessToken.dto';
import { UserRepository } from '../../user/repository/user.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    account: {
      create: jest.fn(),
      update: jest.fn(),
      findByEmail: jest.fn(),
    },
  };

  const mockUserService = {
    findByEmail: jest.fn(),
  };

  const mockUserRepository = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should throw an error if the user is not found', async () => {
      const loginDto: ILoginDto = { email: 'test@example.com', password: 'password' };
      mockUserService.findByEmail.mockResolvedValue(null); // Simulando que o usuário não foi encontrado

      await expect(authService.login(loginDto)).rejects.toThrow(BadRequestException);
      await expect(authService.login(loginDto)).rejects.toThrow('Not found User with this email');
    });

    it('should throw an error if the password is invalid', async () => {
      const loginDto: ILoginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const user = { id: 1, email: 'test@example.com', password: await bcrypt.hash('password', 10), role: 'user' };
      
      mockUserService.findByEmail.mockResolvedValue(user); // Simulando que o usuário foi encontrado
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false); // Simulando que a senha está incorreta

      await expect(authService.login(loginDto)).rejects.toThrow(BadRequestException);
      await expect(authService.login(loginDto)).rejects.toThrow('Not found User with this email');
    });

    it('should return an access token if the login is successful', async () => {
      const loginDto: ILoginDto = { email: 'test@example.com', password: 'password' };
      const user = { id: 1, email: 'test@example.com', password: await bcrypt.hash('password', 10), role: 'user' };
      
      mockUserRepository.findByEmail.mockResolvedValue(user); // Simulando que o usuário foi encontrado
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true); // Simulando que a senha está correta
      mockJwtService.signAsync.mockResolvedValue('mockedToken'); // Simulando o retorno do token

      const result: AccessToken = await authService.login(loginDto);
      expect(result).toEqual({ access_token: 'mockedToken' });
    });
  });
});