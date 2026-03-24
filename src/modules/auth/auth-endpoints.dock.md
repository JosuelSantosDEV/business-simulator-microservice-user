# Auth Endpoints

Base path: `/auth`

## Regras gerais
- `login obrigatório?` Não para rotas com `@PublicRoute()`.
- `permissão RBAC?` Não (nenhuma rota de `auth` usa `@RequirePermissions`).
- `autenticação`:
  - Rotas públicas: sem JWT.
  - `POST /auth/refresh`: exige refresh token válido (guard `JwtRefreshTokenGuard`).
  - `POST /auth/logout`: exige usuário autenticado (JWT de acesso).

## Rotas

### `POST /auth/login`
- Descrição: Autentica o usuário e retorna os tokens de sessão.
- Login: Não
- Permissão: Não
- Body:
  - `email` (string, email, obrigatório)
  - `password` (string, obrigatório)
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `POST /auth/verify-email`
- Descrição: Valida o token de verificação e ativa a conta do usuário.
- Login: Não
- Permissão: Não
- Body:
  - `token` (string, obrigatório)
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `POST /auth/forgot-password`
- Descrição: Inicia o fluxo de recuperação de senha sem revelar existência de email.
- Login: Não
- Permissão: Não
- Body:
  - `email` (string, email, obrigatório)
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `POST /auth/reset-password`
- Descrição: Redefine a senha a partir de um token válido de recuperação.
- Login: Não
- Permissão: Não
- Body:
  - `token` (string, obrigatório)
  - `password` (string, obrigatório, min 8 + regras de complexidade)
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `POST /auth/refresh`
- Descrição: Gera novos tokens com base no refresh token válido.
- Login: Não (rota pública), mas exige refresh token válido no guard
- Permissão: Não
- Body: nenhum
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `POST /auth/logout`
- Descrição: Encerra a sessão do usuário autenticado invalidando o refresh token.
- Login: Sim (JWT de acesso)
- Permissão: Não
- Body: nenhum
- Params: nenhum
- Query: nenhuma
- Status: `204`
