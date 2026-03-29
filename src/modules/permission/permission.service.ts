import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PermissionRepository } from "./permission.repository";
import { PermissionEntity } from "./entity/permission.entity";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UserEntity } from "../user/entity/user.entity";
import { userIsSystem } from "src/common/helpers/user-is-system.helper";
import { ErrorCodes } from "src/common/utils/error-codes.utils";

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  // =============================
  // ============ CREATE =========
  // =============================

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionEntity> {
    const { action, resource, description } = createPermissionDto;

    const existing = await this.permissionRepository.findByActionAndResource(
      action,
      resource,
    );
    if (existing) {
      throw new ConflictException({
        message: `Permissão "${action}:${resource}" já existe no sistema`,
        code: ErrorCodes.PERMISSION_CONFLICT,
      });
    }

    return this.permissionRepository.create(action, resource, description);
  }

  // =============================
  // ============ READ ===========
  // =============================

  async findPermissionsByPermissionQuery(
    queryDto: QueryPermissionDto,
  ): Promise<{ data: PermissionEntity[]; total: number }> {
    const [data, total] =
      await this.permissionRepository.findAllWithFilters(queryDto);

    return { data, total };
  }

  async findPermissionDetails(id: string): Promise<PermissionEntity> {
    const permission = await this.permissionExist(id);
    if (!permission) {
      throw new NotFoundException({
        message: "Permissão não encontrada!",
        code: ErrorCodes.PERMISSION_NOT_FOUND,
      });
    }
    return permission;
  }

  // =============================
  // ============ DELETE =========
  // =============================

  async removePermission(id: string, currentUser: UserEntity): Promise<void> {
    const isSystem = userIsSystem(currentUser);

    const permission = await this.permissionExist(id);
    if (!permission) {
      throw new NotFoundException({
        message: "Permissão não encontrada!",
        code: ErrorCodes.PERMISSION_NOT_FOUND,
      });
    }

    if (!isSystem) {
      const permissionWithRoles =
        await this.permissionRepository.findByIdWithRoles(id);

      const linkedToSystemRole = permissionWithRoles.roles.some(
        (role) => role.isSystem,
      );

      if (linkedToSystemRole) {
        const systemRoleNames = permissionWithRoles.roles
          .filter((role) => role.isSystem)
          .map((role) => role.name)
          .join(", ");

        throw new ForbiddenException({
          message: `Não é possível deletar esta permissão pois ela está associada a role(s) de sistema: ${systemRoleNames}`,
          code: ErrorCodes.PERMISSION_SYSTEM_FORBIDDEN,
        });
      }
    }

    await this.permissionRepository.delete(id);
  }

  async removePermissionFromAllRoles(
    permissionId: string,
    currentUser: UserEntity,
  ): Promise<void> {
    const isSystem = userIsSystem(currentUser);

    const permission = await this.permissionExist(permissionId);
    if (!permission) {
      throw new NotFoundException({
        message: "Permissão não encontrada!",
        code: ErrorCodes.PERMISSION_NOT_FOUND,
      });
    }

    if (!isSystem) {
      const permissionWithRoles =
        await this.permissionRepository.findByIdWithRoles(permissionId);

      const linkedToSystemRole = permissionWithRoles.roles.some(
        (role) => role.isSystem,
      );

      if (linkedToSystemRole) {
        const systemRoleNames = permissionWithRoles.roles
          .filter((role) => role.isSystem)
          .map((role) => role.name)
          .join(", ");

        throw new ForbiddenException({
          message: `Não é possível remover esta permissão de todas as roles pois ela está associada a role(s) de sistema: ${systemRoleNames}`,
          code: ErrorCodes.PERMISSION_SYSTEM_FORBIDDEN,
        });
      }
    }

    await this.permissionRepository.removeFromAllRoles(permissionId);
  }

  // ------------------------- Private -----------------------------

  private async permissionExist(id: string): Promise<PermissionEntity | false> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) return false;
    return permission;
  }
}
