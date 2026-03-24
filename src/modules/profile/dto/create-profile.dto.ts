import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  IsUrl,
} from "class-validator";

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty({ message: "Username é obrigatório" })
  @Length(3, 50, { message: "Username deve ter entre 3 e 50 caracteres" })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Username deve conter apenas letras, números e underscores",
  })
  username: string;

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: "Descrição deve ter no máximo 255 caracteres" })
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: "Contato deve ter no máximo 255 caracteres" })
  contact?: string;

  @IsOptional()
  @IsUrl({}, { message: "Avatar deve ser uma URL válida" })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100, { message: "País deve ter no máximo 100 caracteres" })
  country?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100, { message: "Cidade deve ter no máximo 100 caracteres" })
  city?: string;
}
