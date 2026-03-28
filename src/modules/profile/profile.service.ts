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
import { PaginatedResponse } from "src/common/interfaces/pagination-response.interface";
import { ProfileEntity } from "./entities/profile.entity";

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
      if (existing) throw new ConflictException("Você já possui um perfil.");

      const usernameTaken = await this.profileRepository.findByUsername(
        dto.username,
      );
      if (usernameTaken)
        throw new ConflictException("Este username já está em uso.");

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
      if (error.code === "23505")
        throw new ConflictException("Este username já está em uso.");
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
      const profile = await this.profileRepository.findById(id);
      if (!profile) throw new NotFoundException("Perfil não encontrado.");
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
      if (!profile) throw new NotFoundException("Perfil não encontrado.");
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
  ): Promise<PaginatedResponse<ProfileEntity>> {
    const [profiles, total] =
      await this.profileRepository.findAllByQuery(query);

    const totalPages = Math.ceil(total / (query.limit ?? 10));

    return {
      data: profiles,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages,
        hasNextPage: (query.page ?? 1) < totalPages,
        hasPreviousPage: (query.page ?? 1) > 1,
      },
    };
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
      if (!profile) throw new NotFoundException("Perfil não encontrado.");
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
    const profile = await this.profileRepository.findById(id);
    if (!profile) throw new NotFoundException("Perfil não encontrado.");
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
      if (!profile) throw new NotFoundException("Perfil não encontrado.");
      await this.profileRepository.delete(profile.id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `${new Date(Date.now())} - Erro ao deletar perfil: ${error.message}`,
      );
      throw new InternalServerErrorException("Erro ao deletar perfil.");
    }
  }
}
