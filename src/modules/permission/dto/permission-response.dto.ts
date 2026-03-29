import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { PermissionEntity } from "../entity/permission.entity";

export class PermissionResponseDto {
  id: string;
  action: PermissionAction;
  resource: PermissionResource;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: PermissionEntity): PermissionResponseDto {
    return {
      id: entity.id,
      action: entity.action,
      resource: entity.resource,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
