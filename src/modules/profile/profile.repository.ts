import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProfileEntity } from "./entities/profile.entity";
import { ListProfilesQueryDto } from "./dto/list-profiles-query.dto";

@Injectable()
export class ProfileRepository {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly repo: Repository<ProfileEntity>,
  ) {}

  private readonly PROFILE_ALIAS = "profile";

  // ========================================
  // ================= READ =================
  // ========================================

  async findById(id: string): Promise<ProfileEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  async findByUserId(userId: string): Promise<ProfileEntity | null> {
    return this.repo
      .createQueryBuilder(this.PROFILE_ALIAS)
      .innerJoinAndSelect(`${this.PROFILE_ALIAS}.user`, "user")
      .where("user.id = :userId", { userId })
      .getOne();
  }

  async findByUsername(username: string): Promise<ProfileEntity | null> {
    return this.repo.findOne({ where: { username } });
  }

  async findAllByQuery(
    params: ListProfilesQueryDto,
  ): Promise<[ProfileEntity[], number]> {
    const {
      username,
      country,
      city,
      isVerified,
      sortBy = "username",
      sortOrder = "ASC",
      page = 1,
      limit = 10,
    } = params;

    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder(this.PROFILE_ALIAS)
      .innerJoinAndSelect(`${this.PROFILE_ALIAS}.user`, "user");

    if (username) {
      qb.andWhere(`${this.PROFILE_ALIAS}.username ILIKE :username`, {
        username: `%${username}%`,
      });
    }

    if (country) {
      qb.andWhere(`${this.PROFILE_ALIAS}.country ILIKE :country`, {
        country: `%${country}%`,
      });
    }

    if (city) {
      qb.andWhere(`${this.PROFILE_ALIAS}.city ILIKE :city`, {
        city: `%${city}%`,
      });
    }

    if (isVerified !== undefined) {
      qb.andWhere(`${this.PROFILE_ALIAS}.isVerified = :isVerified`, {
        isVerified,
      });
    }

    // Ordenação dinâmica usando o alias
    qb.orderBy(`${this.PROFILE_ALIAS}.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    return qb.getManyAndCount();
  }

  // ========================================
  // ============== CREATE ==================
  // ========================================

  async create(data: Partial<ProfileEntity>): Promise<ProfileEntity> {
    const profile = this.repo.create(data);
    return this.repo.save(profile);
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

  async update(id: string, data: Partial<ProfileEntity>): Promise<void> {
    await this.repo.update(id, data);
  }

  async setVerified(id: string, isVerified: boolean): Promise<void> {
    await this.repo.update(id, { isVerified });
  }

  // ========================================
  // ============== DELETE ==================
  // ========================================

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
