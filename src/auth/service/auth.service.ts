import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/service/user.service';
import { ILoginDto } from '../dto/Ilogin.dto';
import * as bcrypt from 'bcrypt';
import { AccessToken } from '../dto/accessToken.dto';
import { UserRepository } from '../../user/repository/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(login: ILoginDto): Promise<AccessToken> {
    // Chama o método findByEmail do UserService
    const user = await this.userRepository.findByEmail(login.email);
    
    // Verifica se o usuário foi encontrado
    if (!user) {
      throw new BadRequestException('Not found User with this email');
    }

    // Compara a senha informada com a senha armazenada
    const passwordEncrypted = await bcrypt.compare(login.password, user.password);
    
    // Verifica se a senha está correta
    if (!passwordEncrypted) {
      throw new BadRequestException('Password is invalid');
    }

    // Cria o payload para o token JWT
    const payload = { id: user.id, email: user.email, role: user.role };

    // Retorna o token de acesso assinado
    return { access_token: await this.jwtService.signAsync(payload) };
  }
}
