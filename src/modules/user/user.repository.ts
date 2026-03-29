import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UserEntity } from "./entity/user.entity";
import { RoleEntity } from "../role/entity/role.entity";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { ErrorCodes } from "src/common/utils/error-codes.utils";

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

  async findUserByIdWithRolesAndPermissions(
    id: string,
  ): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { roles: { permissions: true } },
    });
  }

  async findUserByIdWithRoles(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: { roles: true },
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
      .leftJoinAndSelect(`${u}.roles`, "roles")
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
    try {
      const user = this.userRepository.create(data);
      return await this.userRepository.save(user);
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao criar usuário. Tente novamente mais tarde.",
        code: ErrorCodes.USER_INTERNAL_ERROR,
      });
    }
  }

  // ========================================
  // ============== DELETE ==================
  // ========================================

  async softDelete(id: string): Promise<void> {
    try {
      await this.userRepository.softDelete(id);
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao remover usuário. Tente novamente mais tarde.",
        code: ErrorCodes.USER_INTERNAL_ERROR,
      });
    }
  }

  async hardDelete(id: string): Promise<void> {
    try {
      await this.userRepository.delete(id);
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao excluir usuário permanentemente.",
        code: ErrorCodes.USER_INTERNAL_ERROR,
      });
    }
  }

  async restore(id: string): Promise<void> {
    try {
      await this.userRepository.restore(id);
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao restaurar usuário.",
        code: ErrorCodes.USER_INTERNAL_ERROR,
      });
    }
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

  async addRoleToUser(userId: string, roleId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(UserEntity, {
        where: { id: userId },
        relations: ["roles"],
      });

      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
      });

      user.roles.push(role);
      await queryRunner.manager.save(UserEntity, user);

      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException({
        message:
          "Erro ao adicionar role ao usuário. Tente novamente mais tarde.",
        code: ErrorCodes.USER_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from("user_roles")
        .where("user_id = :userId", { userId })
        .andWhere("role_id = :roleId", { roleId })
        .execute();

      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException({
        message: "Erro ao remover role do usuário. Tente novamente mais tarde.",
        code: ErrorCodes.USER_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, data: Partial<UserEntity>): Promise<void> {
    try {
      await this.userRepository.update(id, data);
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao atualizar usuário. Tente novamente mais tarde.",
        code: ErrorCodes.USER_INTERNAL_ERROR,
      });
    }
  }
}
