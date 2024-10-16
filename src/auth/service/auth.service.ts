import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/service/user.service';
import { ILoginDto } from '../dto/Ilogin.dto';
import * as bcrypt from 'bcrypt';
import { AccessToken } from '../dto/accessToken.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(login: ILoginDto): Promise<AccessToken> {
    const user = await this.userService.findByEmail(login.email);
    if (!user) {
      throw new BadRequestException('Not found User with this email');
    }

    const passwordEncrypted = await bcrypt.compare(
      login.password,
      user.password,
    );

    if (!passwordEncrypted) {
      throw new BadRequestException('Password is invalid');
    }
    const payload = { id: user.id, email: user.email, role: user.role };

    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
