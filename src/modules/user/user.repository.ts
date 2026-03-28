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
import { ListUsersQueryDto } from "./dto/list-users-query.dto";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private readonly USER_ALIAS = "user";

  // ========================================
  // ================= READ =================
  // ========================================

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { roles: { permissions: true } },
    });
  }

  async findUserByIdWithRefreshToken(id: string): Promise<UserEntity | null> {
    const u = this.USER_ALIAS;

    return this.userRepository
      .createQueryBuilder(u)
      .addSelect(`${u}.refreshToken`)
      .where(`${u}.id = :id`, { id })
      .getOne();
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUserByEmailWithPassword(email: string): Promise<UserEntity | null> {
    const u = this.USER_ALIAS;

    return this.userRepository
      .createQueryBuilder(u)
      .addSelect(`${u}.password`)
      .leftJoinAndSelect(`${u}.roles`, "roles") // ← adicionar isso
      .where(`${u}.email = :email`, { email })
      .getOne();
  }

  async findUserByEmailVerificationToken(
    token: string,
  ): Promise<UserEntity | null> {
    const u = this.USER_ALIAS;

    return this.userRepository
      .createQueryBuilder(u)
      .addSelect([
        `${u}.emailVerificationToken`,
        `${u}.emailVerificationTokenExpiresAt`,
      ])
      .where(`${u}.emailVerificationToken = :token`, { token })
      .getOne();
  }

  async findUserByPasswordResetToken(
    token: string,
  ): Promise<UserEntity | null> {
    const u = this.USER_ALIAS;

    return this.userRepository
      .createQueryBuilder(u)
      .addSelect([`${u}.passwordResetToken`, `${u}.passwordResetExpiresAt`])
      .where(`${u}.passwordResetToken = :token`, { token })
      .getOne();
  }

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find({
      relations: { roles: { permissions: true } },
    });
  }

  async findAllByQuery(
    query: ListUsersQueryDto,
  ): Promise<[UserEntity[], number]> {
    const {
      status,
      email,
      includeLocked,
      sortBy = "createdAt",
      sortOrder = "DESC",
      page = 1,
      limit = 10,
      includeDeleted = false,
    } = query;

    const u = this.USER_ALIAS;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder(u)
      .leftJoinAndSelect(`${u}.roles`, "roles")
      .leftJoinAndSelect("roles.permissions", "permissions")
      .leftJoinAndSelect(`${u}.profile`, "profile");

    if (status) {
      qb.andWhere(`${u}.status = :status`, { status });
    }

    if (email) {
      qb.andWhere(`${u}.email ILIKE :email`, { email: `%${email}%` });
    }

    if (includeLocked !== undefined) {
      qb.andWhere(`${u}.isLocked = :isLocked`, {
        isLocked: includeLocked === "true",
      });
    }

    if (includeDeleted) {
      qb.withDeleted();
    }

    qb.orderBy(`${u}.${sortBy}`, sortOrder, "NULLS LAST")
      .skip(skip)
      .take(limit);

    return qb.getManyAndCount();
  }

  async findByIdWithPassword(id: string): Promise<UserEntity | null> {
    const u = this.USER_ALIAS;

    return this.userRepository
      .createQueryBuilder(u)
      .addSelect(`${u}.password`)
      .leftJoinAndSelect(`${u}.roles`, "roles")
      .leftJoinAndSelect("roles.permissions", "permissions")
      .leftJoinAndSelect(`${u}.profile`, "profile")
      .where(`${u}.id = :id`, { id })
      .getOne();
  }

  // ========================================
  // ============== CREATE ==================
  // ========================================

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  // ========================================
  // ============== DELETE ==================
  // ========================================

  async softDelete(id: string): Promise<void> {
    await this.userRepository.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async restore(id: string): Promise<void> {
    await this.userRepository.restore(id);
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

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

      if (role.isSystem && !currentUserIsSystem) {
        throw new ForbiddenException(
          `Apenas usuários de sistema podem atribuir a role "${role.name}"`,
        );
      }

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

  async update(id: string, data: Partial<UserEntity>): Promise<void> {
    await this.userRepository.update(id, data);
  }
}
