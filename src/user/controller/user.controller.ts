import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Post,
  Body,
  Logger,
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
  private readonly logger = new Logger(UserController.name);

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('transfer/initiate')
  async createTransfer(
    @Request() req: ExpressRequest,
    @Body() payload: IinitiationTransactionViewDto,
  ): Promise<TransactionResponseDto> {
    const { id } = req['user'];
    this.logger.log(
      `Initiating transfer from user ${id} to ${payload.email} for amount ${payload.amount}`,
    );

    const response = await this.userService.initiateTransfer({
      sender: id,
      receiver: payload.email,
      amount: payload.amount,
    });
    this.logger.log(`Transfer initiated: ${JSON.stringify(response)}`);
    return response;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('transfer/confirm')
  async confirmTransfer(
    @Request() req: ExpressRequest,
    @Body() payload: ConfirmTransactionDto,
  ): Promise<TransactionResponseDto> {
    const { id } = req['user'];
    this.logger.log(
      `Confirming transfer for user ${id} with payload: ${JSON.stringify(payload)}`,
    );
    const response = await this.userService.confirmTransfer(payload, id);
    this.logger.log(`Transfer confirmed: ${JSON.stringify(response)}`);
    return response;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @UseGuards(RoleGuard)
  @Post('transfer/reversal')
  async reverselTransfer(
    @Body() payload: ReversalTransactionDto,
  ): Promise<TransactionResponseDto> {
    this.logger.log(
      `Reversing transfer with payload: ${JSON.stringify(payload)}`,
    );
    const response = await this.userService.reversalTransfer(payload);
    this.logger.log(`Transfer reversed: ${JSON.stringify(response)}`);
    return response;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('transfer/cancel')
  async cancelTransfer(
    @Request() req: ExpressRequest,
    @Body() payload: ReversalTransactionDto,
  ): Promise<TransactionResponseDto> {
    const { id } = req['user'];
    this.logger.log(
      `Cancelling transfer for user ${id} with payload: ${JSON.stringify(payload)}`,
    );
    const response = await this.userService.cancelTransfer(payload, id);
    this.logger.log(`Transfer cancelled: ${JSON.stringify(response)}`);
    return response;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('list-transaction')
  async listTransaction(
    @Request() req: ExpressRequest,
  ): Promise<TransactionResponseDto[]> {
    const { id } = req['user'];
    this.logger.log(`Listing transactions for user ${id}`);
    const response = await this.userService.listTransactions(id);
    this.logger.log(`Transactions listed: ${JSON.stringify(response)}`);
    return response;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Get('balance')
  async showBalance(@Request() req: ExpressRequest): Promise<IAccountViewDto> {
    const { id } = req['user'];
    this.logger.log(`Fetching balance for user ${id}`);
    const response = await this.userService.showBalance(id);
    this.logger.log(`Balance fetched: ${JSON.stringify(response)}`);
    return response;
  }
}
