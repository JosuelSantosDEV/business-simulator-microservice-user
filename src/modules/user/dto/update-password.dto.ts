import { IsString, IsNotEmpty, MinLength } from "class-validator";

export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: "Senha atual é obrigatória" })
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "A nova senha deve ter no mínimo 8 caracteres" })
  newPassword: string;
}
