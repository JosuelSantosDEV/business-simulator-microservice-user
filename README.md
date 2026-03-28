# Business Simulator API (NestJS)

Documentacao atualizada dos endpoints por modulo, com base nas rotas implementadas nos controllers.

Base URL local: `http://localhost:3000`

## Convencoes

- Endpoints protegidos exigem `Authorization: Bearer <access_token>`.
- O modulo `Auth` possui endpoint de refresh com guard especifico para refresh token.
- Endpoints com permissao incluem `RequirePermissions(action, resource)` no controller.
- IDs nas rotas usam UUID quando indicado por `ParseUUIDPipe`.

## Auth Module (`/auth`)

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | `/auth/login` | Publico | Autentica usuario e retorna tokens. |
| POST | `/auth/verify-email` | Publico | Verifica email por token. |
| POST | `/auth/forgot-password` | Publico | Dispara fluxo de recuperacao de senha (resposta neutra). |
| POST | `/auth/reset-password` | Publico | Redefine a senha com token/codigo. |
| POST | `/auth/refresh` | Publico (guard de refresh) | Gera novo access token via refresh token valido. |
| POST | `/auth/logout` | Bearer token | Invalida sessao/token de refresh do usuario autenticado. |

## User Module (`/users`)

| Metodo | Rota | Auth | Permissao | Descricao |
|---|---|---|---|---|
| POST | `/users/new` | Publico | - | Cria conta simples (exige verificacao de email). |
| POST | `/users/new-admin` | Bearer token | `CREATE USER` | Cria usuario administrador. |
| GET | `/users` | Bearer token | `READ USER` | Lista usuarios com filtros/paginacao. |
| GET | `/users/:id` | Bearer token | `READ USER` | Busca usuario por ID. |
| POST | `/users/:id/roles/:roleId` | Bearer token | `UPDATE USER` | Adiciona role ao usuario. |
| DELETE | `/users/:id/roles/:roleId` | Bearer token | `UPDATE USER` | Remove role do usuario. |
| PATCH | `/users/:id/password` | Bearer token | `UPDATE USER` | Atualiza senha de um usuario. |
| POST | `/users/resend-verification` | Publico | - | Reenvia email de verificacao (resposta neutra). |
| PATCH | `/users/:id/status` | Bearer token | `UPDATE USER` | Atualiza status do usuario. |
| DELETE | `/users/me` | Bearer token | - | Remove o proprio usuario autenticado. |
| DELETE | `/users/:id` | Bearer token | `DELETE USER` | Remove usuario por ID. |
| POST | `/users/:id/restore` | Bearer token | `UPDATE USER` | Restaura usuario removido. |

## Profile Module (`/profiles`)

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | `/profiles` | Bearer token | Cria perfil para o usuario autenticado. |
| GET | `/profiles` | Bearer token | Lista perfis com filtros/paginacao. |
| GET | `/profiles/me` | Bearer token | Retorna perfil do usuario autenticado. |
| GET | `/profiles/:id` | Bearer token | Busca perfil por ID. |
| PATCH | `/profiles/me` | Bearer token | Atualiza o proprio perfil. |
| PATCH | `/profiles/:id/verify` | Bearer token | Marca perfil como verificado. |
| PATCH | `/profiles/:id/unverify` | Bearer token | Marca perfil como nao verificado. |
| DELETE | `/profiles/me` | Bearer token | Remove o proprio perfil. |

## Role Module (`/roles`)

| Metodo | Rota | Auth | Permissao | Descricao |
|---|---|---|---|---|
| POST | `/roles` | Bearer token | `CREATE ROLE` | Cria role. |
| GET | `/roles` | Bearer token | `READ ROLE` | Lista roles com filtros. |
| GET | `/roles/default` | Bearer token | `READ ROLE` | Busca role marcada como default. |
| GET | `/roles/:id` | Bearer token | `READ ROLE` | Busca detalhes da role por ID. |
| PATCH | `/roles/:id/default` | Bearer token | `UPDATE ROLE` | Alterna role default (no maximo uma por vez). |
| POST | `/roles/:id/permissions/:permissionId` | Bearer token | `UPDATE ROLE` | Adiciona permissao a role. |
| DELETE | `/roles/:id` | Bearer token | `DELETE ROLE` | Remove role. |
| DELETE | `/roles/:id/permissions/:permissionId` | Bearer token | `DELETE ROLE` | Remove permissao da role. |

## Permission Module (`/permissions`)

| Metodo | Rota | Auth | Permissao | Descricao |
|---|---|---|---|---|
| POST | `/permissions` | Bearer token | `CREATE PERMISSION` | Cria permissao. |
| GET | `/permissions` | Bearer token | `READ PERMISSION` | Lista permissoes com filtros. |
| GET | `/permissions/:id` | Bearer token | `READ PERMISSION` | Busca detalhes da permissao por ID. |
| DELETE | `/permissions/:id` | Bearer token | `DELETE PERMISSION` | Remove permissao. |

## Documentacao por modulo (arquivos locais)

- `src/modules/auth/auth-endpoints.dock.md`
- `src/modules/user/user-endpoints.dock.md`
- `src/modules/profile/profile-endpoints.dock.md`
- `src/modules/role/roles-endpoints.dock.md`
- `src/modules/permission/permission-endpoints.dock.md`

## Execucao do projeto

```bash
npm install
npm run start:dev
```

## Testes

```bash
npm run test
npm run test:e2e
```
