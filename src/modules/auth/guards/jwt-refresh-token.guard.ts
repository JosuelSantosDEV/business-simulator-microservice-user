import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { JWT_REFRESH_STRATEGY } from "src/common/constants/strategies-key.constant";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

@Injectable()
export class JwtRefreshTokenGuard extends AuthGuard(JWT_REFRESH_STRATEGY) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false | null,
    info?: Error,
  ): TUser {
    if (user) {
      return user;
    }

    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException(
        "Refresh token expirado, faça login novamente",
      );
    }

    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    if (err instanceof Error) {
      throw err;
    }

    throw new UnauthorizedException("Refresh token não encontrado");
  }
}
