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

    // Cobre: email não existe + softdelete (TypeORM filtra deletedAt automaticamente)
    // Mesma mensagem para ambos — não revelamos se o email existe
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const passwordMatch = await this.hashingService.compare(
      loginDto.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    // Cobre: PENDING, INACTIVE, BANNED, emailVerifiedAt nulo
    this.validateUserStatus(user);

    const tokens = await this.generateTokens(user);
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);
    await this.userService.updateLastLogin(user.id);

    return tokens;
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.userService.findByIdWithRefreshToken(userId);

    if (!user?.refreshToken) {
      throw new ForbiddenException("Acesso negado");
    }

    const tokenMatch = await this.hashingService.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!tokenMatch) {
      throw new ForbiddenException("Acesso negado");
    }

    const tokens = await this.generateTokens(user);
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
  }

  async verifyEmail(token: string) {
    const user = await this.userService.findByEmailVerificationToken(token);

    // Token não existe ou já foi consumido
    if (!user) {
      throw new BadRequestException({
        message: "Token inválido ou já utilizado.",
        code: "INVALID_VERIFICATION_TOKEN",
      });
    }

    // Token expirado — usuário precisa solicitar reenvio
    if (user.emailVerificationTokenExpiresAt < new Date()) {
      throw new BadRequestException({
        message: "Token expirado. Solicite um novo link de verificação.",
        code: "EXPIRED_VERIFICATION_TOKEN",
      });
    }

    // Já verificado — idempotente, não lança erro
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
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos

    await this.userService.setPasswordResetToken(user.id, token, expiresAt);

    // await this.mailService.sendPasswordReset(user.email, token);
    this.logger.debug(`[RESET TOKEN] ${user.email} → ${token}`);

    return { message: "Se o email existir, você receberá as instruções" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByPasswordResetToken(dto.token);

    if (!user) {
      throw new BadRequestException({
        message: "Token inválido ou já utilizado.",
        code: "INVALID_RESET_TOKEN",
      });
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException({
        message: "Token expirado. Solicite um novo link de recuperação.",
        code: "EXPIRED_RESET_TOKEN",
      });
    }

    const hashed = await this.hashingService.hash(dto.password);
    await this.userService.resetPassword(user.id, hashed);

    return { message: "Senha alterada com sucesso" };
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private validateUserStatus(user: UserEntity): void {
    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        message:
          "Você precisa verificar seu email antes de fazer login. Verifique sua caixa de entrada.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }
    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException({
        message:
          "Você precisa verificar seu email antes de fazer login. Verifique sua caixa de entrada.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException({
        message: "Conta desativada. Entre em contato com o suporte.",
        code: "ACCOUNT_INACTIVE",
      });
    }
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException({
        message: "Conta banida. Entre em contato com o suporte.",
        code: "ACCOUNT_BANNED",
      });
    }
  }

  private async generateTokens(user: UserEntity): Promise<TokensInterface> {
    const payload = { sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      // access token — usa o secret do JwtModule (já configurado)
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessExpiresIn,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      }),

      // refresh token — usa o refreshSecret explicitamente
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfiguration.refreshSecret, // secret diferente aqui
        expiresIn: this.jwtConfiguration.refreshExpiresIn,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
