import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { PermissionEntity } from "./entity/permission.entity";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { ErrorCodes } from "src/common/utils/error-codes.utils";

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // =============================
  // ========== CREATE ===========
  // =============================

  async create(
    action: PermissionAction,
    resource: PermissionResource,
    description?: string,
  ): Promise<PermissionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const permission = queryRunner.manager.create(PermissionEntity, {
        action,
        resource,
        name: `${action}:${resource}`,
        description: description || null,
      });

      const saved = await queryRunner.manager.save(
        PermissionEntity,
        permission,
      );
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code === "23505") {
        throw new ConflictException({
          message: "Já existe uma permissão com esses dados.",
          code: ErrorCodes.PERMISSION_CONFLICT,
        });
      }

      throw new InternalServerErrorException({
        message: "Erro ao criar permissão. Tente novamente mais tarde.",
        code: ErrorCodes.PERMISSION_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // =============================
  // ============ READ ===========
  // =============================

  async findAllWithFilters(
    queryDto: QueryPermissionDto,
  ): Promise<[PermissionEntity[], number]> {
    const { action, resource, name, roleId, page, limit, sortBy, sortOrder } =
      queryDto;

    const queryBuilder: SelectQueryBuilder<PermissionEntity> =
      this.permissionRepository
        .createQueryBuilder("permission")
        .leftJoinAndSelect("permission.roles", "role");

    if (action) {
      queryBuilder.andWhere("permission.action = :action", { action });
    }

    if (resource) {
      queryBuilder.andWhere("permission.resource = :resource", { resource });
    }

    if (name) {
      queryBuilder.andWhere("permission.name ILIKE :name", {
        name: `%${name}%`,
      });
    }

    if (roleId) {
      queryBuilder.andWhere("role.id = :roleId", { roleId });
    }

    queryBuilder.orderBy(`permission.${sortBy}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    return await queryBuilder.getManyAndCount();
  }

  async findById(id: string): Promise<PermissionEntity | null> {
    try {
      return await this.permissionRepository.findOne({ where: { id } });
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao buscar permissão. Tente novamente mais tarde.",
        code: ErrorCodes.PERMISSION_INTERNAL_ERROR,
      });
    }
  }

  async findByIdWithRoles(id: string): Promise<PermissionEntity | null> {
    try {
      return await this.permissionRepository.findOne({
        where: { id },
        relations: { roles: true },
      });
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao buscar permissão. Tente novamente mais tarde.",
        code: ErrorCodes.PERMISSION_INTERNAL_ERROR,
      });
    }
  }

  async findByActionAndResource(
    action: PermissionAction,
    resource: PermissionResource,
  ): Promise<PermissionEntity | null> {
    return this.permissionRepository.findOne({ where: { action, resource } });
  }

  // =============================
  // ========== DELETE ===========
  // =============================

  async delete(id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const permission = await queryRunner.manager.findOne(PermissionEntity, {
        where: { id },
      });

      await queryRunner.manager.remove(PermissionEntity, permission);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof InternalServerErrorException) throw error;

      if (error.code === "23503") {
        throw new ConflictException({
          message: "Não é possível deletar esta permissão pois ela está em uso",
          code: ErrorCodes.PERMISSION_IN_USE,
        });
      }

      throw new InternalServerErrorException({
        message: "Erro ao deletar permissão. Tente novamente mais tarde.",
        code: ErrorCodes.PERMISSION_INTERNAL_ERROR,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async removeFromAllRoles(permissionId: string): Promise<void> {
    try {
      await this.dataSource
        .createQueryBuilder()
        .delete()
        .from("role_permissions")
        .where("permission_id = :permissionId", { permissionId })
        .execute();
    } catch {
      throw new InternalServerErrorException({
        message: "Erro ao remover vínculos da permissão com roles",
        code: ErrorCodes.PERMISSION_INTERNAL_ERROR,
      });
    }
  }
}
