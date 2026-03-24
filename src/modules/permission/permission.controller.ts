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
  UseGuards,
} from "@nestjs/common";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { PermissionService } from "./permission.service";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { UserEntity } from "../user/entity/user.entity";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { JwtAccessTokenGuard } from "../auth/guards/jwt-access-token.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "src/common/decorators/require-permissions.decorator";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";

@Controller("permissions")
@UseGuards(JwtAccessTokenGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // =============================
  // ============ CREATE =========
  // =============================

  @Post()
  @RequirePermissions({
    action: PermissionAction.CREATE,
    resource: PermissionResource.PERMISSION,
  })
  @HttpCode(HttpStatus.CREATED)
  createPermision(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.createPermission(createPermissionDto);
  }

  // =============================
  // ============ READ ===========
  // =============================

  @Get()
  @RequirePermissions({
    action: PermissionAction.READ,
    resource: PermissionResource.PERMISSION,
  })
  findPermissionsByQuery(@Query() queryPermissionDto: QueryPermissionDto) {
    return this.permissionService.findPermissionsByPermissionQuery(
      queryPermissionDto,
    );
  }

  @Get(":id")
  @RequirePermissions({
    action: PermissionAction.READ,
    resource: PermissionResource.PERMISSION,
  })
  findOnePermission(@Param("id", ParseUUIDPipe) id: string) {
    return this.permissionService.findPermissionDetails(id);
  }

  // =============================
  // ============ DELETE =========
  // =============================

  @Delete(":id")
  @RequirePermissions({
    action: PermissionAction.DELETE,
    resource: PermissionResource.PERMISSION,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.permissionService.removePermission(id, currentUser);
  }

  @Delete(":permissionId/roles/:roleId")
  @RequirePermissions({
    action: PermissionAction.DELETE,
    resource: PermissionResource.PERMISSION,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermissionRole(
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
  ) {
    await this.permissionService.removePermissionRole(permissionId, roleId);
  }
}
