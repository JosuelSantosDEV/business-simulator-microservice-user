import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";

export class CreatePermissionDto {
  @IsNotEmpty({ message: "A ação é obrigatória" })
  @IsEnum(PermissionAction, { message: "Ação inválida" })
  action: PermissionAction;

  @IsNotEmpty({ message: "O recurso é obrigatório" })
  @IsEnum(PermissionResource, { message: "Recurso inválido" })
  resource: PermissionResource;

  @IsOptional()
  @IsString({ message: "A descrição deve ser uma string" })
  @MaxLength(255, {
    message: "A descrição não pode ter mais de 255 caracteres",
  })
  description?: string;
}
