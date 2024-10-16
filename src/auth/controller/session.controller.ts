import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { ILoginDto } from '../dto/Ilogin.dto';
import { AccessToken } from '../dto/accessToken.dto';
import { UserService } from '../../user/service/user.service';
import { IcreateUserViewDto } from '../../user/dto/IcreateUser.dto';

@Controller()
export class SessionController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(SessionController.name);

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() payload: ILoginDto): Promise<AccessToken> {
    this.logger.log(`Login attempt with email: ${payload.email}`);

    const token = await this.authService.login(payload);

    this.logger.log(`Login successful for email: ${payload.email}`);
    return token;
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async create(@Body() payload: IcreateUserViewDto): Promise<any> {
    this.logger.log('Registration attempt with data: ' + JSON.stringify(payload));

    const user = await this.userService.create(payload);

    this.logger.log('Registration successful for user: ' + JSON.stringify(user));
    return user;
  }
}
