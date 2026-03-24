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
import {
  CreateUserDto,
  UpdatePasswordDto,
  UserResponseDto,
  ListUsersQueryDto,
} from "./dto";
import { PublicRoute } from "../../common/decorators/public-route.decorator";
import { UserEntity } from "./entity/user.entity";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { ResendEmailVerificationTokenDto } from "./dto/resend-email-verification-token.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

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

// Recebe email, nova senha e o codigo de verificação e troca a senha e reseta o verificador e deleta a resetPasswordAt

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
    // Não retornamos dados do usuário — não há motivo para expô-los antes da verificação
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
  async findAll(@Query() query: ListUsersQueryDto) {
    const result = await this.usersService.findAllByQuery({
      status: query.status,
      email: query.email,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      includeDeleted: query.includeDeleted === "true",
    });

    return {
      data: result.data.map((u) => UserResponseDto.fromEntity(u)),
      meta: {
        total: result.total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: Math.ceil(result.total / (query.limit ?? 10)),
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
    // Sempre a mesma resposta — não revelamos se o email existe ou já foi verificado
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
    await this.usersService.remove(currentUser.id);
  }

  @Delete(":id")
  @RequirePermissions(DELETE_USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
  }

  @Post(":id/restore")
  @RequirePermissions(UPDATE_USER)
  @HttpCode(HttpStatus.OK)
  async restore(@Param("id", ParseUUIDPipe) id: string) {
    const user = await this.usersService.restore(id);
    return UserResponseDto.fromEntity(user);
  }
}
