import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Post,
  Body,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Request as ExpressRequest } from 'express';
import { IAccountViewDto } from '../../account/dto/IcreateAccount.dto';
import {
  ConfirmTransactionDto,
  IinitiationTransactionViewDto,
  ReversalTransactionDto,
  TransactionResponseDto,
} from '../../transaction/dto/transaction.dto';
import { RoleGuard } from '../../auth/guards/role.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('transfer/initiate')
  async createTransfer(
    @Request() req: ExpressRequest,
    @Body() payload: IinitiationTransactionViewDto,
  ): Promise<TransactionResponseDto> {
    const { id } = req['user'];
    return await this.userService.initiateTransfer({
      sender: id,
      receiver: payload.email,
      amount: payload.amount,
    });
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('transfer/confirm')
  async confirmTransfer(
    @Request() req: ExpressRequest,
    @Body() payload: ConfirmTransactionDto,
  ): Promise<TransactionResponseDto> {
    const { id } = req['user'];
    return await this.userService.confirmTransfer(payload, id);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseGuards(RoleGuard)
  @Post('transfer/reversal')
  async reverselTransfer(
    @Body() payload: ReversalTransactionDto,
  ): Promise<TransactionResponseDto> {
    return await this.userService.reversalTransfer(payload);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('transfer/cancel')
  async cancelTransfer(
    @Request() req: ExpressRequest,
    @Body() payload: ReversalTransactionDto,
  ): Promise<TransactionResponseDto> {
    const { id } = req['user'];
    return await this.userService.cancelTransfer(payload, id);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('list-transaction')
  async listTransaction(
    @Request() req: ExpressRequest,
  ): Promise<TransactionResponseDto[]> {
    const { id } = req['user'];
    return await this.userService.listTransaction(id);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('balance')
  async showBalance(@Request() req: ExpressRequest): Promise<IAccountViewDto> {
    const { id } = req['user'];
    return await this.userService.showBalance(id);
  }
}
