import { UserEntity } from "src/modules/user/entity/user.entity";

export function userHasRole(user: UserEntity, roleName: string): boolean {
  return user.roles?.some((role) => role.name === roleName) ?? false;
}
