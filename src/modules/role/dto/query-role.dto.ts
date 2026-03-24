import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { Transform, Type } from "class-transformer";

export enum RoleSortBy {
  NAME = "name",
  CREATED_AT = "createdAt",
}

export class QueryRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true" || value === true)
  isSystem?: boolean;

  @IsOptional()
  @IsUUID()
  permissionId?: string;

  @IsOptional()
  @IsEnum(RoleSortBy)
  sortBy?: RoleSortBy = RoleSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
