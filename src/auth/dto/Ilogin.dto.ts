import { PickType } from '@nestjs/mapped-types';
import { UserDto } from '../../user/dto/user.dto';

export class ILoginDto extends PickType(UserDto, ['email', 'password']) {}
