import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { UsersRepository } from "./user.repository";
import { RoleService } from "../role/role.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserEntity } from "./entity/user.entity";
import { UserStatus } from "src/common/enums/user-status.enum";
import { HashingService } from "src/common/services/hashing.service";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UsersRepository,
    private readonly roleService: RoleService,
    private readonly hashingService: HashingService,
  ) {}

  // ========================================
  // ============== CREATE ==================
  // ========================================

  async createSimpleUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    );

    const user = await this.create(
      { email: createUserDto.email, password: createUserDto.password },
      verificationToken,
      verificationTokenExpiresAt,
    );

    return this.findById(user.id);
  }

  async createAdminUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      const exists = await this.userRepository.findUserByEmail(
        createUserDto.email,
      );

      if (exists) throw new ConflictException("Email já cadastrado");

      const hashed = await this.hashingService.hash(createUserDto.password);

      return await this.userRepository.create({
        email: createUserDto.email,
        password: hashed,
        roles: [],
        status: UserStatus.INACTIVE,
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;

      if (error.code === "23505") {
        throw new ConflictException("Email já cadastrado");
      }

      this.logger.error(
        `${new Date(Date.now())} - Erro ao criar usuário: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        "Erro ao processar criação de usuário",
      );
    }
  }

  async create(
    createUserDto: CreateUserDto,
    verificationToken: string,
    verificationTokenExpiresAt: Date,
  ): Promise<UserEntity> {
    try {
      const exists = await this.userRepository.findUserByEmail(
        createUserDto.email,
      );
      if (exists) throw new ConflictException("Email já cadastrado");

      const defaultRole = await this.roleService.findDefaultRole();
      const hashed = await this.hashingService.hash(createUserDto.password);

      return await this.userRepository.create({
        email: createUserDto.email,
        password: hashed,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: verificationTokenExpiresAt,
        roles: defaultRole ? [defaultRole] : [],
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error.code === "23505")
        throw new ConflictException("Email já cadastrado");
      this.logger.error(
        `${new Date(Date.now())} - Erro ao criar usuário: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        "Erro ao processar criação de usuário",
      );
    }
  }

  // ========================================
  // ================ READ ==================
  // ========================================

  async findById(id: string): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findUserById(id);
      if (!user) throw new NotFoundException("Usuário não encontrado");
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(
        `${new Date(Date.now())} - Erro ao buscar usuário ID ${id}: ${error.message}`,
      );
      throw new InternalServerErrorException("Erro ao buscar usuário");
    }
  }

  async findByIdWithRefreshToken(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findUserByIdWithRefreshToken(id);
    if (!user) throw new NotFoundException("Usuário não encontrado");
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findUserByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository.findUserByEmailWithPassword(email);
  }

  async findByEmailVerificationToken(
    token: string,
  ): Promise<UserEntity | null> {
    return this.userRepository.findUserByEmailVerificationToken(token);
  }

  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    return this.userRepository.findUserByPasswordResetToken(token);
  }

  async findAllByQuery(
    query: ListUsersQueryDto,
  ): Promise<{ data: UserEntity[]; total: number }> {
    const [users, total] = await this.userRepository.findAllByQuery(query);
    return { data: users, total };
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

  async addRoleToUser(
    userId: string,
    roleId: string,
    currentUser: UserEntity,
  ): Promise<{ message: string }> {
    const currentUserIsSystem = currentUser?.roles?.some((r) => r.isSystem);
    await this.userRepository.addRoleToUser(
      userId,
      roleId,
      currentUserIsSystem,
    );
    return { message: "Role adicionada ao usuário com sucesso" };
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string,
    currentUser: UserEntity,
  ): Promise<void> {
    const currentUserIsSystem = currentUser?.roles?.some((r) => r.isSystem);
    await this.userRepository.removeRoleFromUser(
      userId,
      roleId,
      currentUserIsSystem,
    );
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    try {
      const hashed = token ? await this.hashingService.hash(token) : null;
      await this.userRepository.update(id, { refreshToken: hashed });
    } catch (error) {
      this.logger.error(
        `${new Date(Date.now())} - Erro ao atualizar refresh token: ${error.message}`,
      );
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    this.userRepository
      .update(id, { lastLoginAt: new Date() })
      .catch((err) =>
        this.logger.error(
          `${new Date(Date.now())} - Falha ao atualizar lastLogin: ${err.message}`,
        ),
      );
  }

  async markEmailAsVerified(id: string): Promise<void> {
    await this.userRepository.update(id, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      status: UserStatus.ACTIVE,
    });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findUserByEmail(email);

    if (!user) return;

    if (user.status !== UserStatus.PENDING) return;

    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.userRepository.update(user.id, {
      emailVerificationToken: newToken,
      emailVerificationTokenExpiresAt: newExpiresAt,
    });

    this.logger.debug(
      `${new Date(Date.now())} - [VERIFICATION TOKEN] ${user.email} → ${newToken}`,
    );
  }

  async setPasswordResetToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    });
  }

  async resetPassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      refreshToken: null,
      failedLoginAttempts: 0,
      isLocked: false,
      passwordChangedAt: new Date(),
    });
  }

  async updatePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findByIdWithPassword(id);
      if (!user) throw new NotFoundException("Usuário não encontrado");

      const match = await this.hashingService.compare(
        currentPassword,
        user.password,
      );
      if (!match) throw new BadRequestException("Senha atual inválida");

      const hashed = await this.hashingService.hash(newPassword);
      await this.resetPassword(id, hashed);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `${new Date(Date.now())} - Erro ao alterar senha do usuário ${id}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        "Erro ao processar alteração de senha",
      );
    }
  }

  async updateStatus(
    targetId: string,
    newStatus: UserStatus,
    currentUser: UserEntity,
  ): Promise<{ message: string }> {
    const target = await this.findById(targetId);

    const currentUserIsSystem = currentUser.roles?.some((r) => r.isSystem);
    const targetIsSystem = target.roles?.some((r) => r.isSystem);

    if (targetIsSystem && !currentUserIsSystem) {
      throw new ForbiddenException(
        "Você não tem permissão para alterar o status deste usuário.",
      );
    }

    await this.userRepository.update(targetId, { status: newStatus });
    return { message: `Status atualizado para "${newStatus}" com sucesso.` };
  }

  async updateAuthFields(
    id: string,
    data: Partial<
      Pick<UserEntity, "failedLoginAttempts" | "lastFailedLoginAt" | "isLocked">
    >,
  ): Promise<void> {
    await this.userRepository.update(id, data);
  }

  // ========================================
  // ================ DELETE ================
  // ========================================

  async remove(currentUser: UserEntity): Promise<void> {
    const id = currentUser.id;
    try {
      const user = await this.findById(id);

      const currentIsSystem = currentUser.roles?.some((r) => r.isSystem);
      const targetIsSystem = user.roles?.some((r) => r.isSystem);

      if (targetIsSystem && !currentIsSystem) {
        throw new ForbiddenException(
          "Você não tem permissão para remover este usuário.",
        );
      }

      if (!user.emailVerifiedAt) {
        await this.userRepository.hardDelete(id);
        return;
      }

      await this.userRepository.softDelete(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException("Erro ao remover usuário");
    }
  }

  async restore(id: string): Promise<UserEntity> {
    await this.userRepository.restore(id);
    return this.findById(id);
  }
}
