import { SetMetadata } from "@nestjs/common";
import { PERMISSIONS_KEY } from "src/common/constants/auth.constant";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";

export interface RequiredPermission {
  action: PermissionAction;
  resource: PermissionResource;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
