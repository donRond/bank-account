import { Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UserController } from './user/controller/user.controller';
import { UserService } from './user/service/user.service';
import { UserRepository } from './user/repository/user.repository';
import { AccountService } from './account/service/account.service';
import { AccountRepository } from './account/repository/account.repository';
import { AuthService } from './auth/service/auth.service';
import { SessionController } from './auth/controller/session.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransactionService } from './transaction/service/transaction.service';
import { TransactionRepository } from './transaction/repository/transaction.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [UserController, SessionController],
  providers: [
    PrismaService,
    UserService,
    UserRepository,
    AccountService,
    AccountRepository,
    AuthService,
    TransactionService,
    TransactionRepository,
  ],
})
export class AppModule {}
