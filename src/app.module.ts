import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AccountModule } from './account/account.module';

@Module({
  imports: [UserModule, PrismaModule, AccountModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
