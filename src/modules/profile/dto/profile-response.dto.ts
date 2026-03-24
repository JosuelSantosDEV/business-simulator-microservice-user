import { ProfileEntity } from "../entities/profile.entity";

export class ProfileResponseDto {
  id: string;
  username: string;
  displayName: string;
  description: string | null;
  contact: string | null;
  avatarUrl: string | null;
  country: string | null;
  city: string | null;
  isVerified: boolean;
  userId: string;

  static fromEntity(entity: ProfileEntity): ProfileResponseDto {
    const dto = new ProfileResponseDto();
    dto.id = entity.id;
    dto.username = entity.username;
    dto.displayName = entity.displayName;
    dto.description = entity.description;
    dto.contact = entity.contact;
    dto.avatarUrl = entity.avatarUrl;
    dto.country = entity.country;
    dto.city = entity.city;
    dto.isVerified = entity.isVerified;
    dto.userId = entity.user?.id;
    return dto;
  }
}
