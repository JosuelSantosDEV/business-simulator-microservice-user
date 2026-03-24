import { UserEntity } from "src/modules/user/entity/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "profiles" })
@Index("uq_profiles_username_unique", ["username"], { unique: true })
@Index("idx_profiles_user_id", ["user"])
@Index("idx_profiles_country", ["country"])
@Index("idx_profiles_city", ["city"])
@Index("idx_profiles_is_verified", ["isVerified"])
export class ProfileEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserEntity;

  @Column({ type: "varchar", length: 50 })
  username: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  displayName: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  contact: string | null;

  @Column({ type: "varchar", length: 2048, nullable: true })
  avatarUrl: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  country: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city: string | null;

  @Column({ type: "boolean", default: false })
  isVerified: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
