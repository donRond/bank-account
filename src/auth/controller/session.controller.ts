import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() payload: ILoginDto): Promise<AccessToken> {
    return await this.authService.login(payload);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async create(@Body() payload: IcreateUserViewDto): Promise<any> {
    return await this.userService.create(payload);
  }
}
