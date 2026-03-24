# User Endpoints

Base path: `/users`

## Regras gerais
- Login:
  - Obrigatório por padrão (`JwtAccessTokenGuard` + `PermissionsGuard`).
  - Exceções públicas: `POST /users/new` e `POST /users/resend-verification`.
- Permissão RBAC:
  - `read:user`, `create:user`, `update:user`, `delete:user` conforme rota.

## Rotas

### `POST /users/new`
- Descrição: Cria uma conta de usuário comum e inicia o fluxo de verificação por email.
- Login: Não
- Permissão: Não
- Body:
  - `email` (string, email, obrigatório)
  - `password` (string, obrigatório, min 8 + complexidade)
- Params: nenhum
- Query: nenhuma
- Status: `201`

### `POST /users/new-admin`
- Descrição: Cria um usuário administrativo, respeitando as permissões de criação.
- Login: Sim
- Permissão: `create:user`
- Body:
  - `email` (string, email, obrigatório)
  - `password` (string, obrigatório, min 8 + complexidade)
- Params: nenhum
- Query: nenhuma
- Status: `201`

### `GET /users`
- Descrição: Lista usuários com filtros, ordenação e paginação.
- Login: Sim
- Permissão: `read:user`
- Body: nenhum
- Params: nenhum
- Query:
  - `status` (enum `UserStatus`, opcional)
  - `email` (string, opcional)
  - `sortBy` (`createdAt` | `updatedAt` | `deletedAt` | `email`, opcional)
  - `sortOrder` (`ASC` | `DESC`, opcional)
  - `page` (number, opcional)
  - `limit` (number, opcional)
  - `includeDeleted` (`true` | `false`, opcional)
- Status: `200`

### `GET /users/:id`
- Descrição: Busca um usuário específico pelo identificador.
- Login: Sim
- Permissão: `read:user`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `POST /users/:id/roles/:roleId`
- Descrição: Vincula uma role a um usuário específico.
- Login: Sim
- Permissão: `update:user`
- Body: nenhum
- Params:
  - `id` (uuid)
  - `roleId` (uuid)
- Query: nenhuma
- Status: `200`

### `DELETE /users/:id/roles/:roleId`
- Descrição: Remove o vínculo de uma role de um usuário específico.
- Login: Sim
- Permissão: `update:user`
- Body: nenhum
- Params:
  - `id` (uuid)
  - `roleId` (uuid)
- Query: nenhuma
- Status: `204`

### `PATCH /users/me/password`
- Descrição: Atualiza a senha do usuário autenticado usando a senha atual.
- Login: Sim
- Permissão: Não
- Body:
  - `currentPassword` (string, obrigatório)
  - `newPassword` (string, obrigatório)
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `POST /users/resend-verification`
- Descrição: Reenvia o email de verificação sem expor se a conta existe.
- Login: Não
- Permissão: Não
- Body:
  - `email` (string, email, obrigatório)
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `PATCH /users/:id/status`
- Descrição: Atualiza o status de um usuário alvo (ativo, inativo, etc.).
- Login: Sim
- Permissão: `update:user`
- Body:
  - `status` (enum `UserStatus`, obrigatório)
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `DELETE /users/:id`
- Descrição: Remove um usuário pelo id (soft delete para verificados, hard delete para não verificados).
- Login: Sim
- Permissão: `delete:user`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `204`

### `DELETE /users/me`
- Descrição: Remove a própria conta do usuário autenticado.
- Login: Sim
- Permissão: Não
- Body: nenhum
- Params: nenhum
- Query: nenhuma
- Status: `204`

### `POST /users/:id/restore`
- Descrição: Restaura um usuário previamente removido por soft delete.
- Login: Sim
- Permissão: `update:user`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`
