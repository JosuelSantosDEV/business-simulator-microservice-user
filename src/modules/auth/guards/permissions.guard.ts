import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequiredPermission } from "../../../common/decorators/require-permissions.decorator";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { PERMISSIONS_KEY } from "src/common/constants/auth.constant";
import { userHasPermission } from "src/common/helpers/permission.helper";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const { user }: { user: UserEntity } = context.switchToHttp().getRequest();

    if (!user) throw new ForbiddenException("Não autenticado");

    const hasAll = required.every(({ action, resource }) =>
      userHasPermission(user, action, resource),
    );

    if (!hasAll) {
      throw new ForbiddenException("Sem permissão para esta ação");
    }

    return true;
  }
}
