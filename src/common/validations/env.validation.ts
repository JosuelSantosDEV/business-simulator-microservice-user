import * as Joi from "joi";
import { ENV_KEYS } from "src/common/constants/env.constant";

export const envValidationSchema = Joi.object({
  // Database
  [ENV_KEYS.DB_HOST]: Joi.string().required(),
  [ENV_KEYS.DB_PORT]: Joi.number().port().default(5432),
  [ENV_KEYS.DB_USERNAME]: Joi.string().required(),
  [ENV_KEYS.DB_PASSWORD]: Joi.string().required(),
  [ENV_KEYS.DB_NAME]: Joi.string().required(),
  [ENV_KEYS.DB_SYNCHRONIZE]: Joi.boolean().default(false),

  // JWT
  [ENV_KEYS.JWT_SECRET]: Joi.string().min(8).required(),
  [ENV_KEYS.JWT_REFRESH_SECRET]: Joi.string().min(8).required(),
  [ENV_KEYS.JWT_TOKEN_AUDIENCE]: Joi.string().uri().required(),
  [ENV_KEYS.JWT_TOKEN_ISSUE]: Joi.string().required(),
  [ENV_KEYS.JWT_TIME_TO_LIVE]: Joi.number().min(60).default(3600),
  [ENV_KEYS.JWT_REFRESH_TTL]: Joi.number().min(60).default(86400),
});
