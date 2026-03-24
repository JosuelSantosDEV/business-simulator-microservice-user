// src/auth/auth.module.ts

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigType } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtAccessTokenStrategy } from "./strategies/jwt-access-token.strategy";
import { UserModule } from "../user/user.module";
import { HashingModule } from "src/common/modules/hashing.module";
import { jwtConfig } from "src/config/jwt.config";
import { JwtRefreshTokenStrategy } from "./strategies/jwt-refresh-token.strategy";

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    HashingModule,
    PassportModule,
    UserModule, // precisa estar aqui para o JwtStrategy ter acesso ao UsersService
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)], // carrega aqui o registerAs de configuraçẽos
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.secret,
        signOptions: {
          audience: config.audience,
          issuer: config.issuer,
          expiresIn: config.accessExpiresIn,
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtAccessTokenStrategy, // registrado aqui
    JwtRefreshTokenStrategy, // registrado aqui
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
