import {
  IsIn,
  IsOptional,
  IsPositive,
  IsInt,
  IsString,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { UserStatus } from "src/common/enums/user-status.enum";

export type UserSortField = "createdAt" | "updatedAt" | "deletedAt" | "email";
export type SortOrder = "ASC" | "DESC";

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(Object.values(UserStatus))
  status?: UserStatus;

  @IsOptional()
  @IsString()
  @MinLength(3, {
    message: "Digite ao menos 3 caracteres para buscar por email",
  })
  email?: string;

  @IsOptional()
  @IsIn(["createdAt", "updatedAt", "deletedAt", "email"])
  sortBy?: UserSortField = "createdAt";

  @IsOptional()
  @IsIn(["ASC", "DESC"])
  sortOrder?: SortOrder = "DESC";

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

  @IsOptional()
  @IsIn(["true", "false"])
  includeDeleted?: "true" | "false";

  @IsOptional()
  @IsIn(["true", "false"])
  includeLocked?: "true" | "false";
}
