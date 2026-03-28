import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { RoleEntity } from "src/modules/role/entity/role.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from "typeorm";

@Index("uq_permissions_action_resource", ["action", "resource"], {
  unique: true,
})
@Entity({ name: "permissions" })
export class PermissionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  action: PermissionAction;

  @Column({ type: "varchar", length: 100 })
  resource: PermissionResource;

  @Column({ type: "varchar", length: 255, unique: true })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string | null;

  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
