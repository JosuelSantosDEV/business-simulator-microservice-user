import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { RoleService } from "./role.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { UserEntity } from "../user/entity/user.entity";
import { JwtAccessTokenGuard } from "../auth/guards/jwt-access-token.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  RequirePermissions,
  RequiredPermission,
} from "src/common/decorators/require-permissions.decorator";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { RoleResponseDto } from "./dto/role-response.dto";
import { PaginatedResponse } from "src/common/interfaces/pagination-response.interface";

// ALTERAÇÃO: permissões extraídas para constantes acima da classe,
// seguindo o mesmo padrão do UserController
const CREATE_ROLE: RequiredPermission = {
  action: PermissionAction.CREATE,
  resource: PermissionResource.ROLE,
};
const READ_ROLE: RequiredPermission = {
  action: PermissionAction.READ,
  resource: PermissionResource.ROLE,
};
const UPDATE_ROLE: RequiredPermission = {
  action: PermissionAction.UPDATE,
  resource: PermissionResource.ROLE,
};
const DELETE_ROLE: RequiredPermission = {
  action: PermissionAction.DELETE,
  resource: PermissionResource.ROLE,
};

@Controller("roles")
@UseGuards(JwtAccessTokenGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // =============================
  // ============ CREATE =========
  // =============================

  @Post()
  @RequirePermissions(CREATE_ROLE)
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    const role = await this.roleService.createRole(createRoleDto, currentUser);
    return RoleResponseDto.fromEntity(role);
  }

  // =============================
  // ============ READ ===========
  // =============================

  @Get()
  @RequirePermissions(READ_ROLE)
  async findRolesByQuery(
    @Query() queryRoleDto: QueryRoleDto,
  ): Promise<PaginatedResponse<RoleResponseDto>> {
    const { data, total } =
      await this.roleService.findRolesByQuery(queryRoleDto);

    const totalPages = Math.ceil(total / queryRoleDto.limit);

    return {
      data: data.map((r) => RoleResponseDto.fromEntity(r)),
      meta: {
        total,
        page: queryRoleDto.page,
        limit: queryRoleDto.limit,
        totalPages,
        hasNextPage: queryRoleDto.page < totalPages,
        hasPreviousPage: queryRoleDto.page > 1,
      },
    };
  }

  @Get("default")
  @RequirePermissions(READ_ROLE)
  async findDefaultRole() {
    const role = await this.roleService.findDefaultRole();
    return RoleResponseDto.fromEntity(role);
  }

  @Get(":id")
  @RequirePermissions(READ_ROLE)
  async findRole(@Param("id", ParseUUIDPipe) id: string) {
    const role = await this.roleService.findRoleDetails(id);
    return RoleResponseDto.fromEntity(role);
  }

  // =============================
  // ============ UPDATE =========
  // =============================

  @Patch(":id/default")
  @RequirePermissions(UPDATE_ROLE)
  @HttpCode(HttpStatus.OK)
  toggleDefaultRole(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.roleService.toggleDefaultRole(id, currentUser);
  }

  @Post(":id/permissions/:permissionId")
  @RequirePermissions(UPDATE_ROLE)
  @HttpCode(HttpStatus.OK)
  addPermissionToRole(
    @Param("id", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.roleService.addPermissionToRole(
      roleId,
      permissionId,
      currentUser,
    );
  }

  // =============================
  // ============ DELETE =========
  // =============================

  @Delete(":id")
  @RequirePermissions(DELETE_ROLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.roleService.removeRole(id, currentUser);
  }

  @Delete(":id/permissions/:permissionId")
  @RequirePermissions(DELETE_ROLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePermissionFromRole(
    @Param("id", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.roleService.removePermissionFromRole(
      roleId,
      permissionId,
      currentUser,
    );
  }

  @Delete(":id/permissions")
  @RequirePermissions(UPDATE_ROLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAllPermissionsFromRole(
    @Param("id", ParseUUIDPipe) roleId: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.roleService.removeAllPermissionsFromRole(roleId, currentUser);
  }
}
