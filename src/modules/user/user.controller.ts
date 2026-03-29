import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { JwtAccessTokenGuard } from "../auth/guards/jwt-access-token.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import {
  RequirePermissions,
  RequiredPermission,
} from "../../common/decorators/require-permissions.decorator";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { PublicRoute } from "../../common/decorators/public-route.decorator";
import { UserEntity } from "./entity/user.entity";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { ResendEmailVerificationTokenDto } from "./dto/resend-email-verification-token.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { PaginatedResponse } from "src/common/interfaces/pagination-response.interface";

const READ_USER: RequiredPermission = {
  action: PermissionAction.READ,
  resource: PermissionResource.USER,
};
const CREATE_ADMIN_USER: RequiredPermission = {
  action: PermissionAction.CREATE,
  resource: PermissionResource.USER,
};
const UPDATE_USER: RequiredPermission = {
  action: PermissionAction.UPDATE,
  resource: PermissionResource.USER,
};
const DELETE_USER: RequiredPermission = {
  action: PermissionAction.DELETE,
  resource: PermissionResource.USER,
};

@Controller("users")
@UseGuards(JwtAccessTokenGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  // ========================================
  // ============== CREATE ==================
  // ========================================

  @PublicRoute()
  @Post("new")
  @HttpCode(HttpStatus.CREATED)
  async createSimpleUser(@Body() createUserDto: CreateUserDto) {
    await this.usersService.createSimpleUser(createUserDto);
    return {
      message:
        "Conta criada com sucesso! Verifique seu email para ativar sua conta antes de fazer login.",
      requiresEmailVerification: true,
    };
  }

  @Post("new-admin")
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(CREATE_ADMIN_USER)
  async createAdminUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createAdminUser(createUserDto);
    return UserResponseDto.fromEntity(user);
  }

  // ========================================
  // ================ READ ==================
  // ========================================

  @Get()
  @RequirePermissions(READ_USER)
  async findAll(
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const result = await this.usersService.findAllByQuery(query);
    const totalPages = Math.ceil(result.total / query.limit);
    return {
      data: result.data.map((u) => UserResponseDto.fromEntity(u)),
      meta: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  @Get(":id")
  @RequirePermissions(READ_USER)
  async findOneById(@Param("id", ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    return UserResponseDto.fromEntity(user);
  }

  // ========================================
  // ================ UPDATE ================
  // ========================================

  @Post(":id/roles/:roleId")
  @RequirePermissions(UPDATE_USER)
  @HttpCode(HttpStatus.OK)
  async addRoleToUser(
    @Param("id", ParseUUIDPipe) userId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.usersService.addRoleToUser(userId, roleId, currentUser);
  }

  @Delete(":id/roles/:roleId")
  @RequirePermissions(UPDATE_USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRoleFromUser(
    @Param("id", ParseUUIDPipe) userId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.usersService.removeRoleFromUser(userId, roleId, currentUser);
  }

  @Patch("me/password")
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @CurrentUser() currentUser: UserEntity,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(
      currentUser.id,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword,
    );
    return { message: "Senha alterada com sucesso" };
  }

  @PublicRoute()
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendEmailVerificationTokenDto) {
    await this.usersService.resendVerificationEmail(dto.email);
    return {
      message:
        "Se o email existir e ainda não foi verificado, você receberá um novo link em instantes.",
    };
  }

  @Patch(":id/status")
  @RequirePermissions(UPDATE_USER)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.usersService.updateStatus(id, dto.status, currentUser);
  }

  // ========================================
  // ================ DELETE ================
  // ========================================

  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() currentUser: UserEntity) {
    await this.usersService.removeMe(currentUser);
  }

  @Delete(":id")
  @RequirePermissions(DELETE_USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    await this.usersService.removeById(id, currentUser);
  }

  @Post(":id/restore")
  @RequirePermissions(UPDATE_USER)
  @HttpCode(HttpStatus.OK)
  async restore(@Param("id", ParseUUIDPipe) id: string) {
    const user = await this.usersService.restore(id);
    return UserResponseDto.fromEntity(user);
  }
}
