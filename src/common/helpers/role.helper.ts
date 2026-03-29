import { UserEntity } from "src/modules/user/entity/user.entity";

export function userHasRole(user: UserEntity, roleId: string): boolean {
  return user.roles?.some((role) => role.id === roleId) ?? false;
}
