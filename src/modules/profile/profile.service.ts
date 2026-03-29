import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ProfileRepository } from "./profile.repository";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserEntity } from "../user/entity/user.entity";
import { ListProfilesQueryDto } from "./dto/list-profiles-query.dto";
import { ProfileEntity } from "./entities/profile.entity";
import { ErrorCodes } from "src/common/utils/error-codes.utils";

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly profileRepository: ProfileRepository) {}

  // ========================================
  // ============== CREATE ==================
  // ========================================

  async create(
    dto: CreateProfileDto,
    currentUser: UserEntity,
  ): Promise<ProfileEntity> {
    try {
      const existing = await this.profileRepository.findByUserId(
        currentUser.id,
      );
      if (existing) {
        throw new ConflictException({
          message: "Você já possui um perfil.",
          code: ErrorCodes.PROFILE_ALREADY_EXISTS,
        });
      }

      const usernameTaken = await this.profileRepository.findByUsername(
        dto.username,
      );
      if (usernameTaken) {
        throw new ConflictException({
          message: "Este username já está em uso.",
          code: ErrorCodes.PROFILE_USERNAME_CONFLICT,
        });
      }

      return await this.profileRepository.create({
        username: dto.username,
        displayName: `@${dto.username}`,
        description: dto.description ?? null,
        contact: dto.contact ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        country: dto.country ?? null,
        city: dto.city ?? null,
        user: currentUser,
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error.code === "23505") {
        throw new ConflictException({
          message: "Este username já está em uso.",
          code: ErrorCodes.PROFILE_USERNAME_CONFLICT,
        });
      }
      this.logger.error(
        `${new Date(Date.now())} - Erro ao criar perfil: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException("Erro ao criar perfil.");
    }
  }

  // ========================================
  // ================ READ ==================
  // ========================================

  async findById(id: string): Promise<ProfileEntity> {
    try {
      const profile = await this.profileExist(id);
      if (!profile) {
        throw new NotFoundException({
          message: "Perfil não encontrado.",
          code: ErrorCodes.PROFILE_NOT_FOUND,
        });
      }
      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `${new Date(Date.now())} - Erro ao buscar perfil: ${error.message}`,
      );
      throw new InternalServerErrorException("Erro ao buscar perfil.");
    }
  }

  async findMyProfile(currentUser: UserEntity): Promise<ProfileEntity> {
    try {
      const profile = await this.profileRepository.findByUserId(currentUser.id);
      if (!profile) {
        throw new NotFoundException({
          message: "Perfil não encontrado.",
          code: ErrorCodes.PROFILE_NOT_FOUND,
        });
      }
      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `${new Date(Date.now())} - Erro ao buscar perfil: ${error.message}`,
      );
      throw new InternalServerErrorException("Erro ao buscar perfil.");
    }
  }

  async findAllByQuery(
    query: ListProfilesQueryDto,
  ): Promise<{ data: ProfileEntity[]; total: number }> {
    const [data, total] = await this.profileRepository.findAllByQuery(query);
    return { data, total };
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

  async updateMyProfile(
    currentUser: UserEntity,
    dto: UpdateProfileDto,
  ): Promise<ProfileEntity> {
    try {
      const profile = await this.profileRepository.findByUserId(currentUser.id);
      if (!profile) {
        throw new NotFoundException({
          message: "Perfil não encontrado.",
          code: ErrorCodes.PROFILE_NOT_FOUND,
        });
      }
      await this.profileRepository.update(profile.id, dto);
      return this.profileRepository.findById(profile.id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `${new Date(Date.now())} - Erro ao atualizar perfil: ${error.message}`,
      );
      throw new InternalServerErrorException("Erro ao atualizar perfil.");
    }
  }

  async setVerified(
    id: string,
    isVerified: boolean,
  ): Promise<{ message: string }> {
    const profile = await this.profileExist(id);
    if (!profile) {
      throw new NotFoundException({
        message: "Perfil não encontrado.",
        code: ErrorCodes.PROFILE_NOT_FOUND,
      });
    }
    await this.profileRepository.setVerified(id, isVerified);
    return {
      message: `Perfil ${isVerified ? "verificado" : "desverificado"} com sucesso.`,
    };
  }

  // ========================================
  // ============== DELETE ==================
  // ========================================

  async deleteMyProfile(currentUser: UserEntity): Promise<void> {
    try {
      const profile = await this.profileRepository.findByUserId(currentUser.id);
      if (!profile) {
        throw new NotFoundException({
          message: "Perfil não encontrado.",
          code: ErrorCodes.PROFILE_NOT_FOUND,
        });
      }
      await this.profileRepository.delete(profile.id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `${new Date(Date.now())} - Erro ao deletar perfil: ${error.message}`,
      );
      throw new InternalServerErrorException("Erro ao deletar perfil.");
    }
  }

  // ------------------------- Private -----------------------------

  private async profileExist(id: string): Promise<ProfileEntity | false> {
    const profile = await this.profileRepository.findById(id);
    if (!profile) return false;
    return profile;
  }
}
