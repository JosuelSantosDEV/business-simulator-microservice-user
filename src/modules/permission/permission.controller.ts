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
import {
  RequirePermissions,
  RequiredPermission,
} from "src/common/decorators/require-permissions.decorator";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { PaginatedResponse } from "src/common/interfaces/pagination-response.interface";
import { PermissionResponseDto } from "./dto/permission-response.dto";
import { PermissionDetailsResponseDto } from "./dto/permission-datails-response.dto";

const CREATE_PERMISSION: RequiredPermission = {
  action: PermissionAction.CREATE,
  resource: PermissionResource.PERMISSION,
};
const READ_PERMISSION: RequiredPermission = {
  action: PermissionAction.READ,
  resource: PermissionResource.PERMISSION,
};
const DELETE_PERMISSION: RequiredPermission = {
  action: PermissionAction.DELETE,
  resource: PermissionResource.PERMISSION,
};
const UPDATE_PERMISSION: RequiredPermission = {
  action: PermissionAction.UPDATE,
  resource: PermissionResource.PERMISSION,
};

@Controller("permissions")
@UseGuards(JwtAccessTokenGuard, PermissionsGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // =============================
  // ============ CREATE =========
  // =============================

  @Post()
  @RequirePermissions(CREATE_PERMISSION)
  @HttpCode(HttpStatus.CREATED)
  async createPermision(@Body() createPermissionDto: CreatePermissionDto) {
    const permission =
      await this.permissionService.createPermission(createPermissionDto);
    return PermissionResponseDto.fromEntity(permission);
  }

  // =============================
  // ============ READ ===========
  // =============================

  @Get()
  @RequirePermissions(READ_PERMISSION)
  async findPermissionsByQuery(
    @Query() queryPermissionDto: QueryPermissionDto,
  ): Promise<PaginatedResponse<PermissionResponseDto>> {
    const { data, total } =
      await this.permissionService.findPermissionsByPermissionQuery(
        queryPermissionDto,
      );
    const totalPages = Math.ceil(total / queryPermissionDto.limit);
    return {
      data: data.map((p) => PermissionResponseDto.fromEntity(p)),
      meta: {
        total,
        page: queryPermissionDto.page,
        limit: queryPermissionDto.limit,
        totalPages,
        hasNextPage: queryPermissionDto.page < totalPages,
        hasPreviousPage: queryPermissionDto.page > 1,
      },
    };
  }

  @Get(":id")
  @RequirePermissions(READ_PERMISSION)
  async findOnePermission(@Param("id", ParseUUIDPipe) id: string) {
    const permission = await this.permissionService.findPermissionDetails(id);
    return PermissionDetailsResponseDto.fromEntity(permission);
  }

  // =============================
  // ============ DELETE =========
  // =============================

  @Delete(":id")
  @RequirePermissions(DELETE_PERMISSION)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.permissionService.removePermission(id, currentUser);
  }

  @Delete(":id/roles")
  @RequirePermissions(UPDATE_PERMISSION)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePermissionFromAllRoles(
    @Param("id", ParseUUIDPipe) permissionId: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.permissionService.removePermissionFromAllRoles(
      permissionId,
      currentUser,
    );
  }
}
