import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RoleRepository } from "./role.repository";
import { RoleEntity } from "./entity/role.entity";
import { QueryRoleDto } from "./dto/query-role.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UserEntity } from "../user/entity/user.entity";
import { PermissionRepository } from "../permission/permission.repository";
import { userHasPermission } from "src/common/helpers/permission.helper";
import { roleHasPermission } from "src/common/helpers/role-has-permission.helper";
import { userIsSystem } from "src/common/helpers/user-is-system.helper";
import { ErrorCodes } from "src/common/utils/error-codes.utils";

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  // =============================
  // ============ CREATE =========
  // =============================

  async createRole(
    createRoleDto: CreateRoleDto,
    currentUser: UserEntity,
  ): Promise<RoleEntity> {
    const currentUserIsSystem = userIsSystem(currentUser);

    if (createRoleDto.isSystem && !currentUserIsSystem) {
      throw new ForbiddenException({
        message: "Apenas usuários de sistema podem criar roles de sistema",
        code: ErrorCodes.ROLE_SYSTEM_FORBIDDEN,
      });
    }

    const existing = await this.roleRepository.findByName(createRoleDto.name);
    if (existing) {
      throw new ConflictException({
        message: `Já existe uma role com o nome "${createRoleDto.name}"`,
        code: ErrorCodes.ROLE_NAME_CONFLICT,
      });
    }

    return this.roleRepository.create(createRoleDto);
  }

  // =============================
  // ============ READ ===========
  // =============================

  async findRolesByQuery(
    queryDto: QueryRoleDto,
  ): Promise<{ data: RoleEntity[]; total: number }> {
    const [data, total] =
      await this.roleRepository.findAllWithFilters(queryDto);

    return { data, total };
  }

  async findRoleDetails(id: string): Promise<RoleEntity> {
    const role = await this.roleExist(id);
    if (!role) {
      throw new NotFoundException({
        message: "Role não encontrada!",
        code: ErrorCodes.ROLE_NOT_FOUND,
      });
    }
    return role;
  }

  async findById(id: string): Promise<RoleEntity | null> {
    return this.roleRepository.findById(id);
  }

  async findDefaultRole(): Promise<RoleEntity | null> {
    return this.roleRepository.findDefault();
  }

  // =============================
  // ============ UPDATE =========
  // =============================

  async toggleDefaultRole(
    id: string,
    currentUser: UserEntity,
  ): Promise<{
    isDefault: boolean;
    message: string;
  }> {
    const roleTarget = await this.roleExist(id);
    if (!roleTarget) {
      throw new NotFoundException({
        message: "Role não encontrada!",
        code: ErrorCodes.ROLE_NOT_FOUND,
      });
    }

    const currentUserIsSystem = userIsSystem(currentUser);

    if (this.roleIsSystem(roleTarget) && !currentUserIsSystem) {
      throw new ForbiddenException({
        message: "Você não pode alterar propriedades de uma role isSystem",
        code: ErrorCodes.ROLE_SYSTEM_FORBIDDEN,
      });
    }

    const role = await this.roleRepository.toggleDefaultRole(id);

    return {
      isDefault: role.isDefault,
      message: role.isDefault
        ? `"${role.name}" agora é a role padrão. Qualquer outra foi desmarcada.`
        : `"${role.name}" deixou de ser a role padrão.`,
    };
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
    currentUser: UserEntity,
  ): Promise<{ message: string }> {
    const currentUserIsSystem = userIsSystem(currentUser);

    const role = await this.roleExist(roleId);
    if (!role) {
      throw new NotFoundException({
        message: "Role não encontrada!",
        code: ErrorCodes.ROLE_NOT_FOUND,
      });
    }

    if (this.roleIsSystem(role) && !currentUserIsSystem) {
      throw new ForbiddenException({
        message: `Não é possível modificar a role "${role.name}" pois ela é uma role de sistema`,
        code: ErrorCodes.ROLE_SYSTEM_FORBIDDEN,
      });
    }

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException({
        message: "Permissão não encontrada!",
        code: ErrorCodes.PERMISSION_NOT_FOUND,
      });
    }

    if (!currentUserIsSystem) {
      if (
        !userHasPermission(currentUser, permission.action, permission.resource)
      ) {
        throw new ForbiddenException({
          message:
            "Você não pode conceder uma permissão que você mesmo não possui.",
          code: ErrorCodes.PERMISSION_SYSTEM_FORBIDDEN,
        });
      }
    }

    const alreadyLinked = roleHasPermission(role, permission.id);
    if (alreadyLinked) {
      throw new ConflictException({
        message: `A permissão "${permission.name}" já está associada à role "${role.name}"`,
        code: ErrorCodes.PERMISSION_ALREADY_LINKED,
      });
    }

    await this.roleRepository.addPermissionToRole(roleId, permissionId);
    return { message: "Permissão adicionada à role com sucesso" };
  }

  // =============================
  // ============ DELETE =========
  // =============================

  async removeRole(id: string, currentUser: UserEntity): Promise<void> {
    const currentUserIsSystem = userIsSystem(currentUser);

    const role = await this.roleExist(id);
    if (!role) {
      throw new NotFoundException({
        message: "Role não encontrada!",
        code: ErrorCodes.ROLE_NOT_FOUND,
      });
    }

    if (this.roleIsSystem(role) && !currentUserIsSystem) {
      throw new ForbiddenException({
        message: `Não é possível deletar a role "${role.name}" pois ela é uma role de sistema`,
        code: ErrorCodes.ROLE_SYSTEM_FORBIDDEN,
      });
    }

    await this.roleRepository.delete(id);
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
    currentUser: UserEntity,
  ): Promise<void> {
    const currentUserIsSystem = userIsSystem(currentUser);

    const role = await this.roleExist(roleId);
    if (!role) {
      throw new NotFoundException({
        message: "Role não encontrada!",
        code: ErrorCodes.ROLE_NOT_FOUND,
      });
    }

    if (this.roleIsSystem(role) && !currentUserIsSystem) {
      throw new ForbiddenException({
        message: `Não é possível modificar a role "${role.name}" pois ela é uma role de sistema`,
        code: ErrorCodes.ROLE_SYSTEM_FORBIDDEN,
      });
    }

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException({
        message: "Permissão não encontrada!",
        code: ErrorCodes.PERMISSION_NOT_FOUND,
      });
    }

    const isLinked = roleHasPermission(role, permissionId);
    if (!isLinked) {
      throw new NotFoundException({
        message: `A permissão "${permission.name}" não está associada à role "${role.name}"`,
        code: ErrorCodes.PERMISSION_NOT_LINKED,
      });
    }

    await this.roleRepository.removePermissionFromRole(roleId, permissionId);
  }

  async removeAllPermissionsFromRole(
    roleId: string,
    currentUser: UserEntity,
  ): Promise<void> {
    const currentUserIsSystem = userIsSystem(currentUser);

    const role = await this.roleExist(roleId);
    if (!role) {
      throw new NotFoundException({
        message: "Role não encontrada!",
        code: ErrorCodes.ROLE_NOT_FOUND,
      });
    }

    if (this.roleIsSystem(role) && !currentUserIsSystem) {
      throw new ForbiddenException({
        message: `Não é possível modificar a role "${role.name}" pois ela é uma role de sistema`,
        code: ErrorCodes.ROLE_SYSTEM_FORBIDDEN,
      });
    }

    await this.roleRepository.removeAllPermissionsFromRole(roleId);
  }

  // ------------------------- Private -----------------------------

  private async roleExist(id: string): Promise<RoleEntity | false> {
    const role = await this.roleRepository.findByIdWithPermissions(id);
    if (!role) return false;
    return role;
  }

  private roleIsSystem(role: RoleEntity): boolean {
    return role?.isSystem ?? false;
  }
}
