import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  JWT_STRATEGY,
  JWT_REFRESH_STRATEGY,
} from "src/common/constants/strategies-key.constant";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ErrorCodes } from "src/common/utils/error-codes.utils";

@Injectable()
export class JwtAnyTokenGuard extends AuthGuard([
  JWT_STRATEGY,
  JWT_REFRESH_STRATEGY,
]) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false | null,
    info?: unknown,
  ): TUser {
    if (user) return user;

    const infos = Array.isArray(info) ? info : [info];

    const hasExpired = infos.some((i) => i instanceof TokenExpiredError);
    if (hasExpired) {
      throw new UnauthorizedException({
        message: "Token expirado",
        code: ErrorCodes.AUTH_EXPIRED_REFRESH_TOKEN,
      });
    }

    const hasInvalid = infos.some((i) => i instanceof JsonWebTokenError);
    if (hasInvalid) {
      throw new UnauthorizedException({
        message: "Token inválido",
        code: ErrorCodes.AUTH_INVALID_REFRESH_TOKEN,
      });
    }

    if (err instanceof Error) throw err;

    throw new UnauthorizedException({
      message: "Token não encontrado",
      code: ErrorCodes.AUTH_INVALID_REFRESH_TOKEN,
    });
  }
}
