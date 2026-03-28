// src/common/helpers/auth.helper.ts
import { UserEntity } from "src/modules/user/entity/user.entity";
import { BlockingRole } from "../enums/blockin-roles.enum";

export function isRestrictedUser(user: UserEntity): boolean {
  return (
    user.roles?.some(
      (r) =>
        r.isSystem ||
        Object.values(BlockingRole).includes(r.name as BlockingRole),
    ) ?? false
  );
}
