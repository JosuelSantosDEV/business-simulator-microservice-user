import { RoleEntity } from "../entity/role.entity";

export class RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSystem: boolean;
  permissions: { id: string; name: string }[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: RoleEntity): RoleResponseDto {
    const dto = new RoleResponseDto();

    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.isDefault = entity.isDefault;
    dto.isSystem = entity.isSystem;

    dto.permissions = (entity.permissions || []).map((p) => ({
      id: p.id,
      name: p.name,
    }));

    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    return dto;
  }
}
