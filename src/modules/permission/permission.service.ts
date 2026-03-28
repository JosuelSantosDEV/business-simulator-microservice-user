import { Injectable } from "@nestjs/common";
import { PermissionRepository } from "./permission.repository";
import { PermissionEntity } from "./entity/permission.entity";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { PaginatedResponse } from "src/common/interfaces/pagination-response.interface";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UserEntity } from "../user/entity/user.entity";

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  // =============================
  // ============ CREATE =========
  // =============================

  async createPermission(
    createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionEntity> {
    const { action, resource, description } = createPermissionDto;
    return await this.permissionRepository.create(
      action,
      resource,
      description,
    );
  }

  // =============================
  // ============ READ ===========
  // =============================

  async findPermissionsByPermissionQuery(
    queryDto: QueryPermissionDto,
  ): Promise<PaginatedResponse<PermissionEntity>> {
    const [data, total] =
      await this.permissionRepository.findAllWithFilters(queryDto);

    const totalPages = Math.ceil(total / queryDto.limit);
    const hasNextPage = queryDto.page < totalPages;
    const hasPreviousPage = queryDto.page > 1;

    return {
      data,
      meta: {
        total,
        page: queryDto.page,
        limit: queryDto.limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  async findPermissionDetails(id: string): Promise<PermissionEntity> {
    return await this.permissionRepository.findById(id);
  }

  // =============================
  // ============ DELETE =========
  // =============================

  async removePermission(id: string, currentUser: UserEntity): Promise<void> {
    const currentUserIsSystem = currentUser?.roles?.some(
      (role) => role?.isSystem,
    );

    await this.permissionRepository.delete(id, currentUserIsSystem);
  }
  async removePermissionFromAllRoles(permissionId: string): Promise<void> {
    await this.permissionRepository.removeFromAllRoles(permissionId);
  }
}
