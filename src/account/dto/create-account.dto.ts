import { IsNumber } from "class-validator";

export class CreateAccountDto {
  @IsNumber()
  balance: number;
}
