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
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UserEntity } from "./entity/user.entity";
import { UserStatus } from "src/common/enums/user-status.enum";
import { HashingService } from "src/common/services/hashing.service";

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
    ); // 24 horas

    const user = await this.create(
      { email: createUserDto.email, password: createUserDto.password },
      verificationToken,
      verificationTokenExpiresAt,
    );

    return this.findById(user.id);
  }

  async createAdminUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      // Verificando se usuário já existe
      const exists = await this.userRepository.findUserByEmail(
        createUserDto.email,
      );
      // Lançar erro caso exista
      if (exists) throw new ConflictException("Email já cadastrado");
      // Criando hashing de senha
      const hashed = await this.hashingService.hash(createUserDto.password);
      // Montando novo usuário
      return await this.userRepository.create({
        email: createUserDto.email,
        password: hashed,
        roles: [],
        status: UserStatus.INACTIVE,
      });
    } catch (error) {
      // Se o erro já for uma exceção HTTP conhecida repaça
      if (error instanceof ConflictException) throw error;
      // Código 23505 é o padrão PostgreSQL para unique_violation
      if (error.code === "23505") {
        throw new ConflictException("Email já cadastrado");
      }
      // Loga erro para desenvolvedor
      this.logger.error(`Erro ao criar usuário: ${error.message}`, error.stack);
      // Lança erro genérico para usuário
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
      this.logger.error(`Erro ao criar usuário: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        "Erro ao processar criação de usuário",
      );
    }
  }

  // ========================================
  // ================ READ ==================
  // ========================================

  // Buscar usuário por id
  async findById(id: string): Promise<UserEntity> {
    try {
      const user = await this.userRepository.findUserById(id);
      if (!user) throw new NotFoundException("Usuário não encontrado");
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      // Captura erros de conexão com banco, por exemplo
      this.logger.error(`Erro ao buscar usuário ID ${id}: ${error.message}`);
      throw new InternalServerErrorException("Erro ao buscar usuário");
    }
  }

  // Busca usuário com refreshToken
  async findByIdWithRefreshToken(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findUserByIdWithRefreshToken(id);
    if (!user) throw new NotFoundException("Usuário não encontrado");
    return user;
  }

  // Buscar por email
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findUserByEmail(email);
  }

  // Buscar usuário com password
  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository.findUserByEmailWithPassword(email);
  }

  // Buscar usuário pelo token de verificação
  async findByEmailVerificationToken(
    token: string,
  ): Promise<UserEntity | null> {
    return this.userRepository.findUserByEmailVerificationToken(token);
  }

  // Buscar usuário pelo token de resetar senha
  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    return this.userRepository.findUserByPasswordResetToken(token);
  }

  // Busca usuários com paginação, ordenação e filtros
  async findAllByQuery(params: {
    status?: string;
    email?: string; // ← novo
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    page: number;
    limit: number;
    includeDeleted?: boolean;
  }): Promise<{ data: UserEntity[]; total: number }> {
    const [users, total] = await this.userRepository.findAllByQuery(params);
    return { data: users, total };
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

  // Adicionar role a um usuário
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

  // Remover role de um usuário
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

  // Atualizar usuário
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      await this.userRepository.update(id, updateUserDto);

      // Busca novamente para retornar os dados atualizados
      const updated = await this.userRepository.findUserById(id);
      return UserResponseDto.fromEntity(updated);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.logger.error(`Erro ao atualizar usuário ${id}: ${error.message}`);
      throw new InternalServerErrorException(
        "Não foi possível atualizar o usuário",
      );
    }
  }

  // Atualizar refreshToken
  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    try {
      // Se houver token, faz o hash usando o serviço injetado
      const hashed = token ? await this.hashingService.hash(token) : null;
      await this.userRepository.update(id, { refreshToken: hashed });
    } catch (error) {
      this.logger.error(`Erro ao atualizar refresh token: ${error.message}`);
      // Não lançamos erro aqui para não quebrar o fluxo de login, mas logamos
    }
  }

  // Atualizar ultimo login
  async updateLastLogin(id: string): Promise<void> {
    this.userRepository
      .update(id, { lastLoginAt: new Date() })
      .catch((err) =>
        this.logger.error(`Falha ao atualizar lastLogin: ${err.message}`),
      );
  }

  // Setar verificação do usuário
  async markEmailAsVerified(id: string): Promise<void> {
    await this.userRepository.update(id, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      status: UserStatus.ACTIVE,
    });
  }

  // Valida se o email esta verificado e atualiza o token de verificação de email
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findUserByEmail(email);

    // Silencioso — não revelamos se o email existe
    if (!user) return;

    // Já verificado — não faz nada
    if (user.status !== UserStatus.PENDING) return;

    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await this.userRepository.update(user.id, {
      emailVerificationToken: newToken,
      emailVerificationTokenExpiresAt: newExpiresAt,
    });

    // Por enquanto apenas loga — email será implementado depois
    this.logger.debug(`[VERIFICATION TOKEN] ${user.email} → ${newToken}`);
  }

  // Setar token para resetar a senha
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

  // Setar nova senha e resetar verificadores
  async resetPassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      refreshToken: null,
    });
  }

  // Atualizar password
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
        `Erro ao alterar senha do usuário ${id}: ${error.message}`,
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

    // Não-system não pode alterar status de um usuário system
    if (targetIsSystem && !currentUserIsSystem) {
      throw new ForbiddenException(
        "Você não tem permissão para alterar o status deste usuário.",
      );
    }

    await this.userRepository.update(targetId, { status: newStatus });
    return { message: `Status atualizado para "${newStatus}" com sucesso.` };
  }

  // ========================================
  // ================ DELETE ================
  // ========================================

  async remove(id: string): Promise<void> {
    try {
      const user = await this.findById(id);

      // Usuário não verificado — remove permanentemente
      if (!user.emailVerifiedAt) {
        await this.userRepository.hardDelete(id);
        return;
      }

      // Usuário verificado — soft delete
      await this.userRepository.softDelete(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Erro ao remover usuário");
    }
  }

  async restore(id: string): Promise<UserEntity> {
    await this.userRepository.restore(id);
    return this.findById(id);
  }
}
