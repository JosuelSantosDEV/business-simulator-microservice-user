import { PermissionEntity } from "src/modules/permission/entity/permission.entity";
import { UserEntity } from "src/modules/user/entity/user.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from "typeorm";

@Entity({ name: "roles" })
export class RoleEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string | null;

  @Index("idx_roles_is_default")
  @Column({ type: "boolean", default: false })
  isDefault: boolean;

  @Index("idx_roles_is_system")
  @Column({ type: "boolean", default: false })
  isSystem: boolean;

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
    eager: false,
  })
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions: PermissionEntity[];

  @ManyToMany(() => UserEntity, (user) => user.roles)
  users: UserEntity[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
