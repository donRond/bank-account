import { User } from "@prisma/client";

export class UserEntity implements User {
  id: string;
  username: string;
  password: string;
  accountId: string;
} 
