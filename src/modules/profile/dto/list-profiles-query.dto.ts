import {
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  IsInt,
  IsPositive,
  MinLength,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export type ProfileSortField = "username" | "country" | "city";
export type SortOrder = "ASC" | "DESC";

export class ListProfilesQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: "Digite ao menos 2 caracteres para buscar por username",
  })
  username?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsIn(["username", "country", "city"])
  sortBy?: ProfileSortField = "username";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: SortOrder = "ASC";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number = 10;
}
