import { IsString, IsOptional, Length, IsUrl } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  contact?: string;

  @IsOptional()
  @IsUrl({}, { message: "Avatar deve ser uma URL válida" })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  country?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;
}
