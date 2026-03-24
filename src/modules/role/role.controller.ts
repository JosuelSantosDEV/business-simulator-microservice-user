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
import { RequirePermissions } from "src/common/decorators/require-permissions.decorator";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";

@Controller("roles")
@UseGuards(JwtAccessTokenGuard, PermissionsGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // =============================
  // ============ CREATE =========
  // =============================

  @Post()
  @RequirePermissions({
    action: PermissionAction.CREATE,
    resource: PermissionResource.ROLE,
  })
  createRole(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.roleService.createRole(createRoleDto, currentUser);
  }

  // =============================
  // ============ READ ===========
  // =============================

  @Get()
  @RequirePermissions({
    action: PermissionAction.READ,
    resource: PermissionResource.ROLE,
  })
  findRolesByQuery(@Query() queryRoleDto: QueryRoleDto) {
    return this.roleService.findRolesByQuery(queryRoleDto);
  }

  // Obtem a role default
  @Get("default")
  @RequirePermissions({
    action: PermissionAction.READ,
    resource: PermissionResource.ROLE,
  })
  findDefaultRole() {
    return this.roleService.findDefaultRole();
  }

  @Get(":id")
  @RequirePermissions({
    action: PermissionAction.READ,
    resource: PermissionResource.ROLE,
  })
  findRole(@Param("id", ParseUUIDPipe) id: string) {
    return this.roleService.findRoleDetails(id);
  }

  // =============================
  // ============ UPDATE =========
  // =============================

  @Patch(":id/unset-default")
  @RequirePermissions({
    action: PermissionAction.UPDATE,
    resource: PermissionResource.ROLE,
  })
  @HttpCode(HttpStatus.OK)
  unsetDefaultRole(@Param("id", ParseUUIDPipe) id: string) {
    return this.roleService.unsetDefaultRole(id);
  }

  @Post(":id/permissions/:permissionId")
  @RequirePermissions({
    action: PermissionAction.UPDATE,
    resource: PermissionResource.ROLE,
  })
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
  @RequirePermissions({
    action: PermissionAction.DELETE,
    resource: PermissionResource.ROLE,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.roleService.removeRole(id, currentUser);
  }

  @Delete(":id/permissions/:permissionId")
  @RequirePermissions({
    action: PermissionAction.DELETE,
    resource: PermissionResource.ROLE,
  })
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
}
