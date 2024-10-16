import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/service/user.service';
import { ILoginDto } from '../dto/Ilogin.dto';
import * as bcrypt from 'bcrypt';
import { AccessToken } from '../dto/accessToken.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(login: ILoginDto): Promise<AccessToken> {
    this.logger.log(`Login attempt with email: ${login.email}`);
    
    const user = await this.userService.findByEmail(login.email);
    if (!user) {
      this.logger.warn(`Login failed: User not found for email: ${login.email}`);
      throw new BadRequestException('Not found User with this email');
    }

    const passwordEncrypted = await bcrypt.compare(
      login.password,
      user.password,
    );

    if (!passwordEncrypted) {
      this.logger.warn(`Login failed: Invalid password for email: ${login.email}`);
      throw new BadRequestException('Password is invalid');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);
    this.logger.log(`Login successful for email: ${login.email}`);
    
    return { access_token: accessToken };
  }
}
