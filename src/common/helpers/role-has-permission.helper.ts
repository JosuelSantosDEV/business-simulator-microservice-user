import { RoleEntity } from "src/modules/role/entity/role.entity";

export function roleHasPermission(
  role: RoleEntity,
  permissionId: string,
): boolean {
  return role.permissions?.some((p) => p.id === permissionId);
}
