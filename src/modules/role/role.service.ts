import { ForbiddenException, Injectable } from "@nestjs/common";
import { RoleRepository } from "./role.repository";
import { RoleEntity } from "./entity/role.entity";
import { QueryRoleDto } from "./dto/query-role.dto";
import { PaginatedResponse } from "src/common/interfaces/pagination-response.interface";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UserEntity } from "../user/entity/user.entity";
import { PermissionRepository } from "../permission/permission.repository";
import { userHasPermission } from "src/common/helpers/permission.helper";

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
    const currentUserIsSystem = currentUser?.roles?.some((r) => r.isSystem);

    if (createRoleDto.isSystem && !currentUserIsSystem) {
      throw new ForbiddenException(
        "Apenas usuários de sistema podem criar roles de sistema",
      );
    }

    return this.roleRepository.create(createRoleDto);
  }

  // =============================
  // ============ READ ===========
  // =============================

  async findRolesByQuery(
    queryDto: QueryRoleDto,
  ): Promise<PaginatedResponse<RoleEntity>> {
    const [data, total] =
      await this.roleRepository.findAllWithFilters(queryDto);

    const totalPages = Math.ceil(total / queryDto.limit);

    return {
      data,
      meta: {
        total,
        page: queryDto.page,
        limit: queryDto.limit,
        totalPages,
        hasNextPage: queryDto.page < totalPages,
        hasPreviousPage: queryDto.page > 1,
      },
    };
  }

  async findRoleDetails(id: string): Promise<RoleEntity> {
    return this.roleRepository.findById(id);
  }

  async findDefaultRole(): Promise<RoleEntity | null> {
    return this.roleRepository.findDefault();
  }

  // =============================
  // ============ UPDATE =========
  // =============================

  async toggleDefaultRole(id: string): Promise<{
    isDefault: boolean;
    message: string;
  }> {
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
    const currentUserIsSystem = currentUser?.roles?.some((r) => r.isSystem);

    if (!currentUserIsSystem) {
      const permission = await this.permissionRepository.findById(permissionId);

      if (
        !userHasPermission(currentUser, permission.action, permission.resource)
      ) {
        throw new ForbiddenException(
          "Você não pode conceder uma permissão que você mesmo não possui.",
        );
      }
    }

    await this.roleRepository.addPermissionToRole(
      roleId,
      permissionId,
      currentUserIsSystem,
    );
    return { message: "Permissão adicionada à role com sucesso" };
  }
  // =============================
  // ============ DELETE =========
  // =============================

  async removeRole(id: string, currentUser: UserEntity): Promise<void> {
    const currentUserIsSystem = currentUser?.roles?.some((r) => r.isSystem);
    await this.roleRepository.delete(id, currentUserIsSystem);
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
    currentUser: UserEntity,
  ): Promise<void> {
    const currentUserIsSystem = currentUser?.roles?.some((r) => r.isSystem);
    await this.roleRepository.removePermissionFromRole(
      roleId,
      permissionId,
      currentUserIsSystem,
    );
  }

  async removeAllPermissionsFromRole(
    roleId: string,
    currentUser: UserEntity,
  ): Promise<void> {
    const currentUserIsSystem = currentUser?.roles?.some((r) => r.isSystem);

    await this.roleRepository.removeAllPermissionsFromRole(
      roleId,
      currentUserIsSystem,
    );
  }
}
