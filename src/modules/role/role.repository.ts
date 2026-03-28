import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { RoleEntity } from "./entity/role.entity";
import { PermissionEntity } from "../permission/entity/permission.entity";
import { CreateRoleDto } from "./dto/create-role.dto";
import { QueryRoleDto } from "./dto/query-role.dto";

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly RoleRepository: Repository<RoleEntity>,
    private readonly dataSource: DataSource,
  ) {}

  private async clearDefaultFromAllRoles(
    manager: EntityManager,
  ): Promise<void> {
    await manager.update(RoleEntity, { isDefault: true }, { isDefault: false });
  }

  // =============================
  // ========== CREATE ===========
  // =============================

  async create(createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(RoleEntity, {
        where: { name: createRoleDto.name },
      });

      if (existing) {
        throw new ConflictException(
          `Já existe uma role com o nome "${createRoleDto.name}"`,
        );
      }

      if (createRoleDto.isDefault) {
        await this.clearDefaultFromAllRoles(queryRunner.manager);
      }

      const role = queryRunner.manager.create(RoleEntity, {
        name: createRoleDto.name,
        description: createRoleDto.description ?? null,
        isDefault: createRoleDto.isDefault ?? false,
        isSystem: createRoleDto.isSystem ?? false,
      });

      const saved = await queryRunner.manager.save(RoleEntity, role);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      if (error.code === "23505") {
        throw new ConflictException("Já existe uma role com esses dados");
      }

      throw new InternalServerErrorException(
        "Erro ao criar role. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  // =============================
  // ============ READ ===========
  // =============================

  async findAllWithFilters(
    queryDto: QueryRoleDto,
  ): Promise<[RoleEntity[], number]> {
    const {
      name,
      isDefault,
      isSystem,
      permissionId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = queryDto;

    const queryBuilder: SelectQueryBuilder<RoleEntity> =
      this.RoleRepository.createQueryBuilder("role").leftJoin(
        "role.permissions",
        "permission",
      );

    if (name) {
      queryBuilder.andWhere("role.name ILIKE :name", { name: `%${name}%` });
    }

    if (isDefault !== undefined) {
      queryBuilder.andWhere("role.isDefault = :isDefault", { isDefault });
    }

    if (isSystem !== undefined) {
      queryBuilder.andWhere("role.isSystem = :isSystem", { isSystem });
    }

    if (permissionId) {
      queryBuilder.andWhere("permission.id = :permissionId", { permissionId });
    }

    queryBuilder.orderBy(`role.${sortBy}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    return await queryBuilder.getManyAndCount();
  }

  async findById(id: string): Promise<RoleEntity> {
    try {
      const role = await this.RoleRepository.findOne({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${id}" não encontrada`);
      }

      return role;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new InternalServerErrorException(
        "Erro ao buscar role. Tente novamente mais tarde.",
      );
    }
  }

  async findDefault(): Promise<RoleEntity | null> {
    return this.RoleRepository.findOne({ where: { isDefault: true } });
  }

  // =============================
  // ========== UPDATE ===========
  // =============================

  async toggleDefaultRole(id: string): Promise<RoleEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${id}" não encontrada`);
      }

      if (role.isDefault) {
        role.isDefault = false;
        await queryRunner.manager.save(RoleEntity, role);
        await queryRunner.commitTransaction();
        return role;
      }

      await this.clearDefaultFromAllRoles(queryRunner.manager);

      role.isDefault = true;
      await queryRunner.manager.save(RoleEntity, role);
      await queryRunner.commitTransaction();
      return role;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Erro ao alternar role padrão. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  // =============================
  // ========== DELETE ===========
  // =============================

  async delete(id: string, currentUserIsSystem: boolean): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${id}" não encontrada`);
      }

      if (role.isSystem && !currentUserIsSystem) {
        throw new ForbiddenException(
          `Não é possível deletar a role "${role.name}" pois ela é uma role de sistema`,
        );
      }

      await queryRunner.manager.remove(RoleEntity, role);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      if (error.code === "23503") {
        throw new ConflictException(
          "Não é possível deletar esta role pois ela está em uso",
        );
      }

      throw new InternalServerErrorException(
        "Erro ao deletar role. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
    currentUserIsSystem: boolean,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
        relations: ["permissions"],
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${roleId}" não encontrada`);
      }

      if (role.isSystem && !currentUserIsSystem) {
        throw new ForbiddenException(
          `Não é possível modificar a role "${role.name}" pois ela é uma role de sistema`,
        );
      }

      const permission = await queryRunner.manager.findOne(PermissionEntity, {
        where: { id: permissionId },
      });

      if (!permission) {
        throw new NotFoundException(
          `Permissão com ID "${permissionId}" não encontrada`,
        );
      }

      const alreadyLinked = role.permissions.some((p) => p.id === permissionId);
      if (alreadyLinked) {
        throw new ConflictException(
          `A permissão "${permission.name}" já está associada à role "${role.name}"`,
        );
      }

      role.permissions.push(permission);
      await queryRunner.manager.save(RoleEntity, role);
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
        "Erro ao adicionar permissão à role. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
    currentUserIsSystem: boolean,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${roleId}" não encontrada`);
      }

      if (role.isSystem && !currentUserIsSystem) {
        throw new ForbiddenException(
          `Não é possível modificar a role "${role.name}" pois ela é uma role de sistema`,
        );
      }

      const permission = await queryRunner.manager.findOne(PermissionEntity, {
        where: { id: permissionId },
      });

      if (!permission) {
        throw new NotFoundException(
          `Permissão com ID "${permissionId}" não encontrada`,
        );
      }

      const result = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from("role_permissions")
        .where("role_id = :roleId", { roleId })
        .andWhere("permission_id = :permissionId", { permissionId })
        .execute();

      if (result.affected === 0) {
        throw new NotFoundException(
          `A permissão "${permission.name}" não está associada à role "${role.name}"`,
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
        "Erro ao remover permissão da role. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async removeAllPermissionsFromRole(
    roleId: string,
    currentUserIsSystem: boolean,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${roleId}" não encontrada`);
      }

      if (role.isSystem && !currentUserIsSystem) {
        throw new ForbiddenException(
          `Não é possível modificar a role "${role.name}" pois ela é uma role de sistema`,
        );
      }

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from("role_permissions")
        .where("role_id = :roleId", { roleId })
        .execute();

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
        "Erro ao remover todas permissões da role",
      );
    } finally {
      await queryRunner.release();
    }
  }
}
