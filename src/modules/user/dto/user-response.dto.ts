import { UserEntity } from "../entity/user.entity";
import { UserStatus } from "src/common/enums/user-status.enum";

export class UserResponseDto {
  id: string;
  email: string;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  lastFailedLoginAt: Date | null;
  isLocked: boolean;
  roles: { id: string; name: string }[];
  profile?: { id: string; username: string } | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  static fromEntity(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.status = entity.status;
    dto.emailVerifiedAt = entity.emailVerifiedAt;
    dto.lastLoginAt = entity.lastLoginAt;
    dto.failedLoginAttempts = entity.failedLoginAttempts;
    dto.lastFailedLoginAt = entity.lastFailedLoginAt;
    dto.isLocked = entity.isLocked;
    dto.roles = (entity.roles || []).map((r) => ({ id: r.id, name: r.name }));
    dto.profile = entity.profile
      ? { id: entity.profile.id, username: entity.profile.username }
      : null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.deletedAt = entity.deletedAt;
    return dto;
  }
}
