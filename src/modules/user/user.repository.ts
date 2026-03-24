// src/users/users.repository.ts

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UserEntity } from "./entity/user.entity";
import { RoleEntity } from "../role/entity/role.entity";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    private readonly dataSource: DataSource,
  ) {}
  // Alias para uso no QueryBuilder
  private readonly USER_ALIAS = "user";

  // ========================================
  // ================= READ =================
  // ========================================

  // Buscar usuário por id com suas permissions
  async findUserById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: { roles: { permissions: true } },
    });
  }

  // Buscando usuário com o rafreshToken
  async findUserByIdWithRefreshToken(id: string): Promise<UserEntity | null> {
    return this.repo
      .createQueryBuilder(this.USER_ALIAS)
      .addSelect("user.refreshToken")
      .where("user.id = :id", { id })
      .getOne();
  }

  // Buscando usuário pelo email
  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  // Buscando usuário com sua password
  async findUserByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.repo
      .createQueryBuilder(this.USER_ALIAS)
      .addSelect("user.password")
      .leftJoinAndSelect("user.roles", "roles")
      .leftJoinAndSelect("roles.permissions", "permissions")
      .where("user.email = :email", { email })
      .getOne();
  }

  // Buscando usuário pelo token de verificação
  async findUserByEmailVerificationToken(
    token: string,
  ): Promise<UserEntity | null> {
    return this.repo
      .createQueryBuilder(this.USER_ALIAS)
      .addSelect([
        "user.emailVerificationToken",
        "user.emailVerificationTokenExpiresAt",
      ])
      .where("user.emailVerificationToken = :token", { token })
      .getOne();
  }

  // Buscando usuário com o rafreshToken
  async findUserByPasswordResetToken(
    token: string,
  ): Promise<UserEntity | null> {
    return this.repo
      .createQueryBuilder(this.USER_ALIAS)
      .addSelect(["user.passwordResetToken", "user.passwordResetExpiresAt"])
      .where("user.passwordResetToken = :token", { token })
      .getOne();
  }

  // Buscando todos os usuários com suas permissões
  async findAll(): Promise<UserEntity[]> {
    return this.repo.find({
      relations: { roles: { permissions: true } },
    });
  }

  // Buscando usuários com paginação
  async findAllByQuery(params: {
    status?: string;
    email?: string; // ← novo
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    page: number;
    limit: number;
    includeDeleted?: boolean;
  }): Promise<[UserEntity[], number]> {
    const {
      status,
      email,
      sortBy = "createdAt",
      sortOrder = "DESC",
      page,
      limit,
      includeDeleted = false,
    } = params;

    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder(this.USER_ALIAS)
      .leftJoinAndSelect("user.roles", "roles")
      .leftJoinAndSelect("roles.permissions", "permissions")
      .leftJoinAndSelect("user.profile", "profile");

    if (status) {
      qb.andWhere("user.status = :status", { status });
    }

    if (email) {
      // ILIKE = case-insensitive no PostgreSQL
      qb.andWhere("user.email ILIKE :email", { email: `%${email}%` });
    }

    if (includeDeleted) {
      qb.withDeleted();
    }

    qb.orderBy(`user.${sortBy}`, sortOrder, "NULLS LAST")
      .skip(skip)
      .take(limit);

    return qb.getManyAndCount();
  }

  async findByIdWithPassword(id: string): Promise<UserEntity | null> {
    return this.repo
      .createQueryBuilder(this.USER_ALIAS)
      .addSelect("user.password")
      .leftJoinAndSelect("user.roles", "roles")
      .leftJoinAndSelect("roles.permissions", "permissions")
      .leftJoinAndSelect("user.profile", "profile")
      .where("user.id = :id", { id })
      .getOne();
  }

  // ========================================
  // ============== CREATE ==================
  // ========================================

  // Criando usuário
  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  // ========================================
  // ============== DELETE ==================
  // ========================================

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

  // Adicionar role a um usuário
  async addRoleToUser(
    userId: string,
    roleId: string,
    currentUserIsSystem: boolean,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(UserEntity, {
        where: { id: userId },
        relations: ["roles"],
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com ID "${userId}" não encontrado`,
        );
      }

      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${roleId}" não encontrada`);
      }

      // Só isSystem pode atribuir roles isSystem
      if (role.isSystem && !currentUserIsSystem) {
        throw new ForbiddenException(
          `Apenas usuários de sistema podem atribuir a role "${role.name}"`,
        );
      }

      // Verifica se já está associada
      const alreadyHasRole = user.roles.some((r) => r.id === roleId);
      if (alreadyHasRole) {
        throw new ConflictException(
          `O usuário já possui a role "${role.name}"`,
        );
      }

      user.roles.push(role);
      await queryRunner.manager.save(UserEntity, user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Erro ao adicionar role ao usuário. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Remover role de um usuário
  async removeRoleFromUser(
    userId: string,
    roleId: string,
    currentUserIsSystem: boolean,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(UserEntity, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(
          `Usuário com ID "${userId}" não encontrado`,
        );
      }

      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${roleId}" não encontrada`);
      }

      // Só isSystem pode remover roles isSystem
      if (role.isSystem && !currentUserIsSystem) {
        throw new ForbiddenException(
          `Apenas usuários de sistema podem remover a role "${role.name}"`,
        );
      }

      const result = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from("user_roles")
        .where("user_id = :userId", { userId })
        .andWhere("role_id = :roleId", { roleId })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException(
          `O usuário não possui a role "${role.name}"`,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Erro ao remover role do usuário. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Atualizando informações do usuário
  async update(id: string, data: Partial<UserEntity>): Promise<void> {
    await this.repo.update(id, data);
  }
}
