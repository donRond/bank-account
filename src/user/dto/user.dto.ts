import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UserDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  role: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  accountId: string;

  createdAt: Date;
}
