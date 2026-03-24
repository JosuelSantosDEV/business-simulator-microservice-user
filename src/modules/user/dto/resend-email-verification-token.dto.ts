import { IsEmail, IsNotEmpty } from "class-validator";

export class ResendEmailVerificationTokenDto {
  @IsEmail({}, { message: "Email inválido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email: string;
}
