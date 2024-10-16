import { PickType } from '@nestjs/mapped-types';
import { UserDto } from './user.dto';

export class IUpdateUserDto extends PickType(UserDto, [
  'email',
  'name',
  'password',
  'accountId',
] as const) {}
