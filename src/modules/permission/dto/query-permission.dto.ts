import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsUUID,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";

export enum PermissionSortField {
  CREATED_AT = "createdAt",
  UPDATED_AT = "updatedAt",
  NAME = "name",
  ACTION = "action",
  RESOURCE = "resource",
}

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC",
}

export class QueryPermissionDto {
  // Filtros
  @IsOptional()
  @IsEnum(PermissionAction)
  action?: PermissionAction;

  @IsOptional()
  @IsEnum(PermissionResource)
  resource?: PermissionResource;

  @IsOptional()
  @IsString()
  name?: string; // busca parcial no name

  @IsOptional()
  @IsUUID()
  roleId?: string; // filtrar permissões de uma role específica

  // Paginação
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // Ordenação
  @IsOptional()
  @IsEnum(PermissionSortField)
  sortBy?: PermissionSortField = PermissionSortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
