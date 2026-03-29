import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Inject,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigType } from "@nestjs/config";
import { randomBytes } from "crypto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { UserStatus } from "src/common/enums/user-status.enum";
import { UserEntity } from "../user/entity/user.entity";
import { UserService } from "../user/user.service";
import { jwtConfig } from "src/config/jwt.config";
import { HashingService } from "src/common/services/hashing.service";
import { TokensInterface } from "src/common/interfaces/tokens.interface";
import { isRestrictedUser } from "src/common/helpers/auth.helper";
import { ErrorCodes } from "src/common/utils/error-codes.utils";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hashingService: HashingService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmailWithPassword(loginDto.email);

    if (!user) {
      throw new UnauthorizedException({
        message: "Credenciais inválidas",
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
      });
    }

    if (user.isLocked) {
      throw new ForbiddenException({
        message: "Usuário bloqueado",
        code: ErrorCodes.AUTH_USER_LOCKED,
      });
    }

    this.validateUserStatus(user);

    const isRestricted = isRestrictedUser(user);

    if (isRestricted) this.checkPasswordExpiration(user);

    const passwordMatch = await this.hashingService.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatch) {
      if (isRestricted) await this.handleFailedLogin(user);
      throw new UnauthorizedException({
        message: "Credenciais inválidas",
        code: ErrorCodes.AUTH_INVALID_CREDENTIALS,
      });
    }

    if (isRestricted) await this.handleSuccessfulLogin(user);

    const tokens = await this.generateTokens(user);

    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);
    await this.userService.updateLastLogin(user.id);

    return tokens;
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.userService.findByIdWithRefreshToken(userId);

    if (!user?.refreshToken) {
      throw new ForbiddenException({
        message: "Acesso negado",
        code: ErrorCodes.AUTH_INVALID_REFRESH_TOKEN,
      });
    }

    const tokenMatch = await this.hashingService.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!tokenMatch) {
      throw new ForbiddenException({
        message: "Acesso negado",
        code: ErrorCodes.AUTH_INVALID_REFRESH_TOKEN,
      });
    }

    if (user.isLocked) {
      throw new ForbiddenException({
        message: "Usuário bloqueado.",
        code: ErrorCodes.AUTH_USER_LOCKED,
      });
    }

    this.validateUserStatus(user);

    const tokens = await this.generateTokens(user);
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
  }

  async verifyEmail(token: string) {
    const user = await this.userService.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException({
        message: "Token inválido ou já utilizado.",
        code: ErrorCodes.AUTH_INVALID_VERIFICATION_TOKEN,
      });
    }

    if (user.emailVerificationTokenExpiresAt < new Date()) {
      throw new BadRequestException({
        message: "Token expirado. Solicite um novo link de verificação.",
        code: ErrorCodes.AUTH_EXPIRED_VERIFICATION_TOKEN,
      });
    }

    if (user.emailVerifiedAt) {
      return { message: "Email já verificado. Você pode fazer login." };
    }

    await this.userService.markEmailAsVerified(user.id);

    return {
      message: "Email verificado com sucesso. Você já pode fazer login.",
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user || user.status === UserStatus.PENDING) {
      return { message: "Se o email existir, você receberá as instruções" };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.userService.setPasswordResetToken(user.id, token, expiresAt);

    this.logger.debug(
      `${new Date(Date.now())}[RESET TOKEN] ${user.email} → ${token}`,
    );

    return { message: "Se o email existir, você receberá as instruções" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByPasswordResetToken(dto.token);

    if (!user) {
      throw new BadRequestException({
        message: "Token inválido ou já utilizado.",
        code: ErrorCodes.AUTH_INVALID_RESET_TOKEN,
      });
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException({
        message: "Token expirado. Solicite um novo link de recuperação.",
        code: ErrorCodes.AUTH_EXPIRED_RESET_TOKEN,
      });
    }

    const hashed = await this.hashingService.hash(dto.password);
    await this.userService.resetPassword(user.id, hashed);

    return { message: "Senha alterada com sucesso" };
  }

  // ------------------------------- Private ------------------------------------

  private validateUserStatus(user: UserEntity): void {
    if (!user.emailVerifiedAt || user.status === UserStatus.PENDING) {
      throw new ForbiddenException({
        message:
          "Você precisa verificar seu email antes de fazer login. Verifique sua caixa de entrada.",
        code: ErrorCodes.AUTH_EMAIL_NOT_VERIFIED,
      });
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException({
        message: "Conta desativada. Entre em contato com o suporte.",
        code: ErrorCodes.AUTH_ACCOUNT_INACTIVE,
      });
    }

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException({
        message: "Conta banida. Entre em contato com o suporte.",
        code: ErrorCodes.AUTH_ACCOUNT_BANNED,
      });
    }
  }

  private async generateTokens(user: UserEntity): Promise<TokensInterface> {
    const payload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessExpiresIn,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      }),

      this.jwtService.signAsync(payload, {
        secret: this.jwtConfiguration.refreshSecret,
        expiresIn: this.jwtConfiguration.refreshExpiresIn,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async handleFailedLogin(user: UserEntity): Promise<void> {
    const MAX_ATTEMPTS = 3;
    user.failedLoginAttempts += 1;
    user.lastFailedLoginAt = new Date();

    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.isLocked = true;
    }

    await this.userService.updateAuthFields(user.id, {
      failedLoginAttempts: user.failedLoginAttempts,
      lastFailedLoginAt: user.lastFailedLoginAt,
      isLocked: user.isLocked,
    });
  }

  private async handleSuccessfulLogin(user: UserEntity): Promise<void> {
    await this.userService.updateAuthFields(user.id, {
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      isLocked: false,
    });
  }

  private checkPasswordExpiration(user: UserEntity): void {
    const referenceDate = user.passwordChangedAt ?? user.createdAt;
    const diffInDays =
      (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays > 30) {
      throw new ForbiddenException({
        message: "Senha expirada. Troque sua senha para continuar.",
        code: ErrorCodes.AUTH_PASSWORD_EXPIRED,
      });
    }
  }
}
