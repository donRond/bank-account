import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import * as bcrypt from 'bcrypt';
import { AccountService } from 'src/account/account.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository,
    private readonly accountService: AccountService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {

    const { username, password } = createUserDto;

    if (username.length < 3) throw "username invalid";

    const userExists = await this.userRepository.findUserByUsername(username);

    if (userExists) throw "username already used";

    if (!password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z$*&@#]{8,}$/)) throw "password invalid";

    const hash = await bcrypt.hash(password, 8);

    createUserDto.password = hash;


    const user = await this.userRepository.create(createUserDto);

    if (!user) throw "fail to register user"

    const { id: accountId } = await this.accountService.create();

    const updatedUser = {
      ...user,
      accountId
    }

    const userUpdate = await this.updateUser(updatedUser);

    return userUpdate;


  }


  async updateUser(updateUserDto: UpdateUserDto): Promise<UserEntity> {

    const userExists = await this.userRepository.findUserByUsername(updateUserDto.username);

    if (!userExists) throw "User not found"

    const updatedUser = {
      ...userExists,
      ...updateUserDto
    }

    return await this.userRepository.update(updatedUser);

  }
}
