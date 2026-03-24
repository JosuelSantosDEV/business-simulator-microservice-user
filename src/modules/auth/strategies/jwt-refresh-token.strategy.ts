import { Inject, Injectable } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConfig } from "src/config/jwt.config";
import { Request } from "express";
import { JWT_REFRESH_STRATEGY } from "src/common/constants/strategies-key.constant";

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  JWT_REFRESH_STRATEGY,
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.refreshSecret, // usa o refreshSecret aqui
      audience: config.audience,
      issuer: config.issuer,
      passReqToCallback: true, // precisa para pegar o token bruto no validate
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    // pega o token bruto para comparar com o hash no banco
    const refreshToken = req.headers.authorization
      ?.replace("Bearer ", "")
      .trim();
    return { id: payload.sub, refreshToken };
  }
}
