import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { PermissionEntity } from "../entity/permission.entity";

class RoleSummaryDto {
  id: string;
  name: string;
  isSystem: boolean;
}

export class PermissionDetailsResponseDto {
  id: string;
  action: PermissionAction;
  resource: PermissionResource;
  name: string;
  description: string | null;
  roles: RoleSummaryDto[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: PermissionEntity): PermissionDetailsResponseDto {
    return {
      id: entity.id,
      action: entity.action,
      resource: entity.resource,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      roles:
        entity.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          isSystem: role.isSystem,
        })) || [],
    };
  }
}
