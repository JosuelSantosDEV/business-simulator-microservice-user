import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWT_STRATEGY } from "src/common/constants/strategies-key.constant";
import { jwtConfig } from "src/config/jwt.config";
import { UserEntity } from "src/modules/user/entity/user.entity";
import { UserService } from "src/modules/user/user.service";

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(
  Strategy,
  JWT_STRATEGY,
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
      audience: config.audience, // validação consistente
      issuer: config.issuer, // com o JwtRefreshStrategy
    });
  }

  async validate(payload: { sub: string }): Promise<UserEntity> {
    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
