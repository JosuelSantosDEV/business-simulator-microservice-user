import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ListProfilesQueryDto } from "./dto/list-profiles-query.dto";
import { JwtAccessTokenGuard } from "../auth/guards/jwt-access-token.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { UserEntity } from "../user/entity/user.entity";
import { ProfileResponseDto } from "./dto/profile-response.dto";

@Controller("profiles")
@UseGuards(JwtAccessTokenGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ========================================
  // ============== CREATE ==================
  // ========================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProfileDto: CreateProfileDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    const profile = await this.profileService.create(
      createProfileDto,
      currentUser,
    );
    return ProfileResponseDto.fromEntity(profile);
  }

  // ========================================
  // ================ READ ==================
  // ========================================

  @Get()
  async findAll(@Query() query: ListProfilesQueryDto) {
    const { data, meta } = await this.profileService.findAllByQuery(query);
    return {
      data: data.map((p) => ProfileResponseDto.fromEntity(p)),
      meta,
    };
  }

  @Get("me")
  async findMyProfile(@CurrentUser() currentUser: UserEntity) {
    const profile = await this.profileService.findMyProfile(currentUser);
    return ProfileResponseDto.fromEntity(profile);
  }
  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    const profile = await this.profileService.findById(id);
    return ProfileResponseDto.fromEntity(profile);
  }

  // ========================================
  // ============== UPDATE ==================
  // ========================================

  @Patch("me")
  @HttpCode(HttpStatus.OK)
  async updateMyProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    const profile = await this.profileService.updateMyProfile(
      currentUser,
      updateProfileDto,
    );
    return ProfileResponseDto.fromEntity(profile);
  }
  @Patch(":id/verify")
  @HttpCode(HttpStatus.OK)
  setVerified(@Param("id", ParseUUIDPipe) id: string) {
    return this.profileService.setVerified(id, true);
  }

  @Patch(":id/unverify")
  @HttpCode(HttpStatus.OK)
  setUnverified(@Param("id", ParseUUIDPipe) id: string) {
    return this.profileService.setVerified(id, false);
  }

  // ========================================
  // ============== DELETE ==================
  // ========================================

  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMyProfile(@CurrentUser() currentUser: UserEntity) {
    return this.profileService.deleteMyProfile(currentUser);
  }
}
