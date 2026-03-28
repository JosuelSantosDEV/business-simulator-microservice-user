import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateUserDto {
  @IsEmail({}, { message: "O e-mail informado não é válido." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  @MaxLength(255)
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).+$/, {
    message:
      "A senha deve conter letra maiúscula, minúscula, número e caractere especial.",
  })
  password: string;
}
