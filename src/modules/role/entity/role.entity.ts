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
  name: string; // ex: "admin", "moderator"

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string | null;

  @Index("idx_roles_is_default") // Otimizar busca pois pode ser uma query importante
  @Column({ type: "boolean", default: false })
  isDefault: boolean; // role atribuída automaticamente em novos usuários

  @Index("idx_roles_is_system") // Otimizar busca pois pode ser uma query importante
  @Column({ type: "boolean", default: false })
  isSystem: boolean; // roles protegidas que não podem ser deletadas (ex: super_admin)

  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, {
    eager: false, // sempre carrega as permissões junto com a role quando for: true
  })
  // Criação da tabela intermediária role_permissions de forma automática
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
