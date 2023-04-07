import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserEntity } from "../entities/user.entity";

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    return await this.prisma.user.create({
      data: createUserDto
    })
  }
  async findUserByUsername(username: string): Promise<UserEntity> {
    return this.prisma.user.findUnique({
      where: {
        username
      }
    })
  }

  async update(updateUserDto: UpdateUserDto): Promise<UserEntity> {
    return await this.prisma.user.update({
      where: {
        username: updateUserDto.username
      },
      data: updateUserDto
    })
  }

}
