import { UserEntity } from "src/modules/user/entity/user.entity";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";

export function userHasPermission(
  user: UserEntity,
  action: PermissionAction,
  resource: PermissionResource,
): boolean {
  return (
    user.roles?.some((role) =>
      role.permissions?.some(
        (p) =>
          (p.action === action && p.resource === resource) ||
          (p.action === PermissionAction.MANAGE && p.resource === resource),
      ),
    ) ?? false
  );
}
