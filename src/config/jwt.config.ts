import { registerAs } from "@nestjs/config";
import { JWT_CONFIG_KEY } from "src/common/constants/auth.constant";
import { ENV_KEYS } from "src/common/constants/env.constant";
import { JwtConfigInterface } from "src/common/interfaces/jwt-config.interface";

export const jwtConfig = registerAs(
  JWT_CONFIG_KEY,
  (): JwtConfigInterface => ({
    secret: process.env[ENV_KEYS.JWT_SECRET],
    refreshSecret: process.env[ENV_KEYS.JWT_REFRESH_SECRET],
    accessExpiresIn: +process.env[ENV_KEYS.JWT_TIME_TO_LIVE],
    refreshExpiresIn: +process.env[ENV_KEYS.JWT_REFRESH_TTL],
    audience: process.env[ENV_KEYS.JWT_TOKEN_AUDIENCE],
    issuer: process.env[ENV_KEYS.JWT_TOKEN_ISSUE],
  }),
);

// export const jwtConfig = registerAs("jwt", (): JwtConfigInterface => ({
//   privateKey: process.env[ENV_KEYS.JWT_PRIVATE_KEY], // só o UserService conhece
//   publicKey: process.env[ENV_KEYS.JWT_PUBLIC_KEY],   // Kong e outros serviços conhecem
//   accessExpiresIn: +process.env[ENV_KEYS.JWT_TIME_TO_LIVE],
//   refreshExpiresIn: +process.env[ENV_KEYS.JWT_REFRESH_TTL],
//   audience: process.env[ENV_KEYS.JWT_TOKEN_AUDIENCE],
//   issuer: process.env[ENV_KEYS.JWT_TOKEN_ISSUE],
// }));
