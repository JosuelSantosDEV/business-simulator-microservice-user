# Profile Endpoints

Base path: `/profiles`

## Regras gerais

- Login: Sim (todas as rotas usam `JwtAccessTokenGuard`).
- Permissão RBAC: Não (este módulo não usa `@RequirePermissions` no controller).

## Rotas

### `POST /profiles`

- Descrição: Cria o perfil do usuário autenticado.
- Login: Sim
- Permissão: Não
- Body:
  - `username` (string, obrigatório, 3-50, letras/números/underscore)
  - `description` (string, opcional)
  - `contact` (string, opcional)
  - `avatarUrl` (string URL, opcional)
  - `country` (string, opcional)
  - `city` (string, opcional)
- Params: nenhum
- Query: nenhuma
- Status: `201`

### `GET /profiles`

- Descrição: Lista perfis com filtros e paginação.
- Login: Sim
- Permissão: Não
- Body: nenhum
- Params: nenhum
- Query:
  - `username` (string, opcional)
  - `country` (string, opcional)
  - `city` (string, opcional)
  - `isVerified` (`true` | `false`, opcional)
  - `sortBy` (`username` | `country` | `city`, opcional)
  - `sortOrder` (`ASC` | `DESC`, opcional)
  - `page` (number, opcional)
  - `limit` (number, opcional)
- Status: `200`

### `GET /profiles/me`

- Descrição: Retorna o perfil do usuário autenticado.
- Login: Sim
- Permissão: Não
- Body: nenhum
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `GET /profiles/:id`

- Descrição: Busca um perfil específico pelo identificador.
- Login: Sim
- Permissão: Não
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `PATCH /profiles/me`

- Descrição: Atualiza os dados do perfil do usuário autenticado.
- Login: Sim
- Permissão: Não
- Body:
  - `description` (string, opcional)
  - `contact` (string, opcional)
  - `avatarUrl` (string URL, opcional)
  - `country` (string, opcional)
  - `city` (string, opcional)
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `PATCH /profiles/:id/verify`

- Descrição: Marca um perfil como verificado.
- Login: Sim
- Permissão: Não
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `PATCH /profiles/:id/unverify`

- Descrição: Remove a marcação de verificado de um perfil.
- Login: Sim
- Permissão: Não
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `DELETE /profiles/me`

- Descrição: Remove o perfil do usuário autenticado.
- Login: Sim
- Permissão: Não
- Body: nenhum
- Params: nenhum
- Query: nenhuma
- Status: `204`

