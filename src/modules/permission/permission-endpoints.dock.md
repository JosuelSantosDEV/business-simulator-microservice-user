# Permission Endpoints

Base path: `/permissions`

## Regras gerais

- Login: Sim (todas as rotas usam `JwtAccessTokenGuard`).
- Permissão RBAC: Sim (todas as rotas usam `@RequirePermissions` com recurso `permission`).
- Para desassociar uma permissão de uma role, use `DELETE /roles/:id/permissions/:permissionId` (módulo de roles).

## Rotas

### `POST /permissions`

- Descrição: Cria uma nova permissão no sistema.
- Login: Sim
- Permissão: `create:permission`
- Body:
  - `action` (enum `PermissionAction`, obrigatório)
  - `resource` (enum `PermissionResource`, obrigatório)
  - `description` (string, opcional)
- Params: nenhum
- Query: nenhuma
- Status: `201`

### `GET /permissions`

- Descrição: Lista permissões com filtros, ordenação e paginação.
- Login: Sim
- Permissão: `read:permission`
- Body: nenhum
- Params: nenhum
- Query:
  - `action` (enum `PermissionAction`, opcional)
  - `resource` (enum `PermissionResource`, opcional)
  - `name` (string, opcional)
  - `roleId` (uuid, opcional)
  - `page` (number, opcional)
  - `limit` (number, opcional)
  - `sortBy` (`createdAt` | `updatedAt` | `name` | `action` | `resource`, opcional)
  - `sortOrder` (`ASC` | `DESC`, opcional)
- Status: `200`

### `GET /permissions/:id`

- Descrição: Busca os detalhes de uma permissão específica.
- Login: Sim
- Permissão: `read:permission`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `DELETE /permissions/:id`

- Descrição: Remove uma permissão existente do sistema.
- Login: Sim
- Permissão: `delete:permission`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `204`

### `DELETE /permissions/:id/roles`

- Descrição: Remove **todas as associações da permissão com roles** (desvincula a permissão de todas as roles).
- Login: Sim
- Permissão: `update:permission`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `204`

