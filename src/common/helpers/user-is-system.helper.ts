import { UserEntity } from "src/modules/user/entity/user.entity";

export function userIsSystem(user: UserEntity): boolean {
  return user?.roles?.some((r) => r.isSystem) ?? false;
}
