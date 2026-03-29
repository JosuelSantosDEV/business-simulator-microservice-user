import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { PublicRoute } from "../../common/decorators/public-route.decorator";
import { JwtRefreshTokenGuard } from "./guards/jwt-refresh-token.guard";
import { JwtAnyTokenGuard } from "./guards/jwt-any-token.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @PublicRoute()
  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @PublicRoute()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @PublicRoute()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @PublicRoute()
  @UseGuards(JwtRefreshTokenGuard)
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() user: { id: string; refreshToken: string }) {
    return this.authService.refresh(user.id, user.refreshToken);
  }

  @PublicRoute()
  @UseGuards(JwtAnyTokenGuard)
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser("id") userId: string) {
    return this.authService.logout(userId);
  }
}

// Verificar se a estratégia esta bloqueando usuários que não estão ativados ou pending
// testar aplicação
// Sistema de email para verificar usuário
// Cache para usuário - roles - permissoes
// Cache para sessões de refresh-token
