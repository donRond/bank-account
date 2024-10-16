import { PickType } from '@nestjs/mapped-types';
import { UserDto } from './user.dto';

export class IcreateUserViewDto extends PickType(UserDto, [
  'email',
  'name',
  'password',
] as const) {}

export class IcreateUserDto extends PickType(UserDto, [
  'email',
  'name',
  'password',
] as const) {}
