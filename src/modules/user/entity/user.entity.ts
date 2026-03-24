import { UserStatus } from "src/common/enums/user-status.enum";
import { ProfileEntity } from "src/modules/profile/entities/profile.entity";
import { RoleEntity } from "src/modules/role/entity/role.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  Index,
  OneToOne,
} from "typeorm";

@Entity({ name: "users" })
@Index("uq_users_email", ["email"], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 255, select: false })
  password: string;

  @Index("idx_users_status")
  @Column({ type: "enum", enum: UserStatus, default: UserStatus.PENDING })
  status: UserStatus;

  @Column({ type: "varchar", nullable: true, select: false })
  refreshToken: string | null;

  @Column({ type: "varchar", nullable: true, select: false })
  emailVerificationToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: "timestamp", nullable: true, select: false })
  emailVerificationTokenExpiresAt: Date | null;

  @Column({ type: "varchar", nullable: true, select: false })
  passwordResetToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpiresAt: Date | null;

  @Index("idx_users_last_login_at")
  @Column({ type: "timestamp", nullable: true })
  lastLoginAt: Date | null;

  @ManyToMany(() => RoleEntity, (role) => role.users, {
    eager: false,
  })
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  roles: RoleEntity[];

  @OneToOne(() => ProfileEntity, (profile) => profile.user)
  profile: ProfileEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Index("idx_users_deleted_at")
  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt: Date | null;
}
