import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { PermissionEntity } from "./entity/permission.entity";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
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
      const existing = await queryRunner.manager.findOne(PermissionEntity, {
        where: { action, resource },
      });

      if (existing) {
        throw new ConflictException(
          `Permissão "${action}:${resource}" já existe no sistema`,
        );
      }

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

      if (error instanceof ConflictException) throw error;

      if (error.code === "23505") {
        throw new ConflictException("Já existe uma permissão com esses dados");
      }

      throw new InternalServerErrorException(
        "Erro ao criar permissão. Tente novamente mais tarde.",
      );
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

  async findById(id: string): Promise<PermissionEntity> {
    try {
      const permission = await this.permissionRepository.findOne({
        where: { id },
        relations: ["roles"],
      });

      if (!permission) {
        throw new NotFoundException(`Permissão com ID "${id}" não encontrada`);
      }

      return permission;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Erro ao buscar permissão. Tente novamente mais tarde.",
      );
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
      const permission = await queryRunner.manager.findOne(PermissionEntity, {
        where: { id },

        relations: currentUserIsSystem ? [] : ["roles"],
      });

      if (!permission) {
        throw new NotFoundException(`Permissão com ID "${id}" não encontrada`);
      }

      if (!currentUserIsSystem) {
        const linkedToSystemRole = permission.roles.some(
          (role) => role.isSystem,
        );

        if (linkedToSystemRole) {
          const systemRoleNames = permission.roles
            .filter((role) => role.isSystem)
            .map((role) => role.name)
            .join(", ");

          throw new ForbiddenException(
            `Não é possível deletar esta permissão pois ela está associada a role(s) de sistema: ${systemRoleNames}`,
          );
        }
      }

      await queryRunner.manager.remove(PermissionEntity, permission);
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
          "Não é possível deletar esta permissão pois ela está em uso",
        );
      }

      throw new InternalServerErrorException(
        "Erro ao deletar permissão. Tente novamente mais tarde.",
      );
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
      throw new InternalServerErrorException(
        "Erro ao remover vínculos da permissão com roles",
      );
    }
  }
}
