export class ErrorCodes {
  // ========================================
  // ================= AUTH =================
  // ========================================

  /** Email ainda não verificado ou conta com status PENDING */
  static readonly AUTH_EMAIL_NOT_VERIFIED = "AUTH_EMAIL_NOT_VERIFIED";

  /** Conta desativada por um administrador */
  static readonly AUTH_ACCOUNT_INACTIVE = "AUTH_ACCOUNT_INACTIVE";

  /** Conta banida */
  static readonly AUTH_ACCOUNT_BANNED = "AUTH_ACCOUNT_BANNED";

  /** Usuário bloqueado por excesso de tentativas de login */
  static readonly AUTH_USER_LOCKED = "AUTH_USER_LOCKED";

  /** Senha expirada — necessário trocar antes de continuar */
  static readonly AUTH_PASSWORD_EXPIRED = "AUTH_PASSWORD_EXPIRED";

  /** Token de verificação de email inválido ou já utilizado */
  static readonly AUTH_INVALID_VERIFICATION_TOKEN =
    "AUTH_INVALID_VERIFICATION_TOKEN";

  /** Token de verificação de email expirado */
  static readonly AUTH_EXPIRED_VERIFICATION_TOKEN =
    "AUTH_EXPIRED_VERIFICATION_TOKEN";

  /** Token de redefinição de senha inválido ou já utilizado */
  static readonly AUTH_INVALID_RESET_TOKEN = "AUTH_INVALID_RESET_TOKEN";

  /** Token de redefinição de senha expirado */
  static readonly AUTH_EXPIRED_RESET_TOKEN = "AUTH_EXPIRED_RESET_TOKEN";

  /** Credenciais inválidas (email ou senha incorretos) */
  static readonly AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";

  /** Refresh token inválido ou não encontrado */
  static readonly AUTH_INVALID_REFRESH_TOKEN = "AUTH_INVALID_REFRESH_TOKEN";

  /** Refresh token expirado */
  static readonly AUTH_EXPIRED_REFRESH_TOKEN = "AUTH_EXPIRED_REFRESH_TOKEN";

  /** Sem permissão para acessar rota */
  static readonly AUTH_ACCOUNT_NO_HAS_PERMISSION =
    "AUTH_ACCOUNT_NO_HAS_PERMISSION";

  // ========================================
  // ================= USER =================
  // ========================================

  /** Usuário não encontrado */
  static readonly USER_NOT_FOUND = "USER_NOT_FOUND";

  /** Email já cadastrado */
  static readonly USER_EMAIL_CONFLICT = "USER_EMAIL_CONFLICT";

  /** Conta desativada ou banida — ação não permitida */
  static readonly USER_ACCOUNT_RESTRICTED = "USER_ACCOUNT_RESTRICTED";

  /** Senha atual informada está incorreta */
  static readonly USER_INVALID_CURRENT_PASSWORD =
    "USER_INVALID_CURRENT_PASSWORD";

  /** Operação em usuário de sistema requer privilégio de sistema */
  static readonly USER_SYSTEM_FORBIDDEN = "USER_SYSTEM_FORBIDDEN";

  /** Erro interno ao executar ação */
  static readonly USER_INTERNAL_ERROR = "USER_INTERNAL_ERROR";

  // ========================================
  // ================= ROLE =================
  // ========================================

  /** Role não encontrada */
  static readonly ROLE_NOT_FOUND = "ROLE_NOT_FOUND";

  /** Já existe uma role com esse nome */
  static readonly ROLE_NAME_CONFLICT = "ROLE_NAME_CONFLICT";

  /** Usuário já possui essa role */
  static readonly ROLE_ALREADY_ASSIGNED = "ROLE_ALREADY_ASSIGNED";

  /** Usuário não possui essa role */
  static readonly ROLE_NOT_ASSIGNED = "ROLE_NOT_ASSIGNED";

  /** Operação em role de sistema requer privilégio de sistema */
  static readonly ROLE_SYSTEM_FORBIDDEN = "ROLE_SYSTEM_FORBIDDEN";

  /** Erro interno ao executar ação */
  static readonly ROLE_INTERNAL_ERROR = "ROLE_INTERNAL_ERROR";

  /** Role está em uso e não pode ser deletada */
  static readonly ROLE_IN_USE = "ROLE_IN_USE";

  // ========================================
  // ============= PERMISSION ===============
  // ========================================

  /** Permissão não encontrada */
  static readonly PERMISSION_NOT_FOUND = "PERMISSION_NOT_FOUND";

  /** Já existe uma permissão com essa combinação action:resource */
  static readonly PERMISSION_CONFLICT = "PERMISSION_CONFLICT";

  /** Permissão já está associada à role */
  static readonly PERMISSION_ALREADY_LINKED = "PERMISSION_ALREADY_LINKED";

  /** Permissão não está associada à role */
  static readonly PERMISSION_NOT_LINKED = "PERMISSION_NOT_LINKED";

  /**
   * Permissão está vinculada a uma role de sistema —
   * apenas usuários de sistema podem removê-la
   */
  static readonly PERMISSION_SYSTEM_FORBIDDEN = "PERMISSION_SYSTEM_FORBIDDEN";

  /** Erro interno ao executar ação */
  static readonly PERMISSION_INTERNAL_ERROR = "PERMISSION_INTERNAL_ERROR";

  /** Permissão esta em associada a outras roles, não podendo ser deletada */
  static readonly PERMISSION_IN_USE = "PERMISSION_IN_USE";

  // ========================================
  // ================ PROFILE ===============
  // ========================================

  /** Perfil não encontrado */
  static readonly PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND";

  /** Usuário já possui um perfil */
  static readonly PROFILE_ALREADY_EXISTS = "PROFILE_ALREADY_EXISTS";

  /** Username já está em uso por outro perfil */
  static readonly PROFILE_USERNAME_CONFLICT = "PROFILE_USERNAME_CONFLICT";

  /** Erro interno ao executar ação */
  static readonly PROFILE_INTERNAL_ERROR = "PROFILE_INTERNAL_ERROR";
}
