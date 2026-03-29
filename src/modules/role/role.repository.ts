import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
import { ErrorCodes } from "src/common/utils/error-codes.utils";

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

      if (error instanceof ConflictException) throw error;

      if (error.code === "23505") {
        throw new ConflictException({
          message: "Já existe uma role com esses dados",
          code: ErrorCodes.ROLE_NAME_CONFLICT,
        });
      }

      throw new InternalServerErrorException({
        message: "Erro ao criar role. Tente novamente mais tarde.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
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

  async findById(id: string): Promise<RoleEntity | null> {
    try {
      return await this.RoleRepository.findOne({ where: { id } });
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao buscar role. Tente novamente mais tarde.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
    }
  }

  async findByIdWithPermissions(id: string): Promise<RoleEntity | null> {
    try {
      return await this.RoleRepository.findOne({
        where: { id },
        relations: { permissions: true },
      });
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao buscar role. Tente novamente mais tarde.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
    }
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.RoleRepository.findOne({ where: { name } });
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
    } catch {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException({
        message: "Erro ao alternar role padrão. Tente novamente mais tarde.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // =============================
  // ========== DELETE ===========
  // =============================

  async delete(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id },
      });

      await queryRunner.manager.remove(RoleEntity, role);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code === "23503") {
        throw new ConflictException({
          message: "Não é possível deletar esta role pois ela está em uso",
          code: ErrorCodes.ROLE_IN_USE,
        });
      }

      throw new InternalServerErrorException({
        message: "Erro ao deletar role. Tente novamente mais tarde.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async addPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
        relations: ["permissions"],
      });

      const permission = await queryRunner.manager.findOne(PermissionEntity, {
        where: { id: permissionId },
      });

      role.permissions.push(permission);
      await queryRunner.manager.save(RoleEntity, role);
      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException({
        message:
          "Erro ao adicionar permissão à role. Tente novamente mais tarde.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from("role_permissions")
        .where("role_id = :roleId", { roleId })
        .andWhere("permission_id = :permissionId", { permissionId })
        .execute();

      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException({
        message:
          "Erro ao remover permissão da role. Tente novamente mais tarde.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async removeAllPermissionsFromRole(roleId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from("role_permissions")
        .where("role_id = :roleId", { roleId })
        .execute();

      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();

      throw new InternalServerErrorException({
        message: "Erro ao remover todas permissões da role.",
        code: ErrorCodes.ROLE_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }
}
