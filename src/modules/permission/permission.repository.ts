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
import { RoleEntity } from "../role/entity/role.entity";

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

  // Busca permissões com filtros, paginação e ordenação
  async findAllWithFilters(
    queryDto: QueryPermissionDto,
  ): Promise<[PermissionEntity[], number]> {
    const { action, resource, name, roleId, page, limit, sortBy, sortOrder } =
      queryDto;

    const queryBuilder: SelectQueryBuilder<PermissionEntity> =
      this.permissionRepository
        .createQueryBuilder("permission")
        .leftJoinAndSelect("permission.roles", "role");

    // Aplicar filtros
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

    // Aplicar ordenação
    queryBuilder.orderBy(`permission.${sortBy}`, sortOrder);

    // Aplicar paginação
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Retorna [dados, total]
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

  async removeRoleFromPermission(
    permissionId: string,
    roleId: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verifica se a permissão existe
      const permission = await queryRunner.manager.findOne(PermissionEntity, {
        where: { id: permissionId },
      });

      if (!permission) {
        throw new NotFoundException(
          `Permissão com ID "${permissionId}" não encontrada`,
        );
      }

      // Verifica se a role existe
      const role = await queryRunner.manager.findOne(RoleEntity, {
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role com ID "${roleId}" não encontrada`);
      }

      // DELETE direto na tabela intermediária
      const result = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from("role_permissions")
        .where("role_id = :roleId", { roleId })
        .andWhere("permission_id = :permissionId", { permissionId })
        .execute();

      // Verifica se a associação existia
      if (result.affected === 0) {
        throw new NotFoundException(
          `A role "${role.name}" não está associada a esta permissão`,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Erro ao remover role da permissão. Tente novamente mais tarde.",
      );
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string, currentUserIsSystem: boolean): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const permission = await queryRunner.manager.findOne(PermissionEntity, {
        where: { id },
        // Só carrega roles se precisar validar se alguma esta ligada a uma role isSystem— evita join desnecessário
        relations: currentUserIsSystem ? [] : ["roles"],
      });

      if (!permission) {
        throw new NotFoundException(`Permissão com ID "${id}" não encontrada`);
      }

      // Só valida se o usuário não for isSystem
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
}
