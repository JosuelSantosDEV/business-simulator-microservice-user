import { Module } from "@nestjs/common";
import { PermissionController } from "./permission.controller";
import { PermissionService } from "./permission.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionEntity } from "./entity/permission.entity";
import { RoleEntity } from "../role/entity/role.entity";
import { PermissionRepository } from "./permission.repository";

@Module({
  imports: [TypeOrmModule.forFeature([PermissionEntity, RoleEntity])],
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository],
  exports: [PermissionService, PermissionRepository],
})
export class PermissionModule {}
