# Role Endpoints

Base path: `/roles`

## Regras gerais

- Login: Sim (todas as rotas usam `JwtAccessTokenGuard`).
- Permissão RBAC: Sim (todas as rotas usam `@RequirePermissions` com recurso `role`).

## Rotas

### `POST /roles`

- Descrição: Cria uma nova role no sistema. Se `isDefault` for `true`, todas as outras roles deixam de ser padrão (só pode existir uma).
- Login: Sim
- Permissão: `create:role`
- Body:
  - `name` (string, obrigatório)
  - `description` (string, opcional)
  - `isDefault` (boolean, opcional)
  - `isSystem` (boolean, opcional)
- Params: nenhum
- Query: nenhuma
- Status: `201`

### `GET /roles`

- Descrição: Lista roles com filtros, ordenação e paginação.
- Login: Sim
- Permissão: `read:role`
- Body: nenhum
- Params: nenhum
- Query:
  - `name` (string, opcional)
  - `isDefault` (boolean, opcional)
  - `isSystem` (boolean, opcional)
  - `permissionId` (uuid, opcional)
  - `sortBy` (`name` | `createdAt`, opcional)
  - `sortOrder` (`ASC` | `DESC`, opcional)
  - `page` (number, opcional)
  - `limit` (number, opcional)
- Status: `200`

### `GET /roles/default`

- Descrição: Retorna a role configurada como padrão.
- Login: Sim
- Permissão: `read:role`
- Body: nenhum
- Params: nenhum
- Query: nenhuma
- Status: `200`

### `GET /roles/:id`

- Descrição: Busca os detalhes de uma role específica.
- Login: Sim
- Permissão: `read:role`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `PATCH /roles/:id/default`

- Descrição: Alterna se a role é a padrão (`isDefault`): se passar a `true`, desmarca automaticamente qualquer outra role padrão (só pode existir uma); se já for padrão, passa a `false`.
- Login: Sim
- Permissão: `update:role`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `200`

### `POST /roles/:id/permissions/:permissionId`

- Descrição: Associa uma permissão existente à role informada.
- Login: Sim
- Permissão: `update:role`
- Body: nenhum
- Params:
  - `id` (uuid)
  - `permissionId` (uuid)
- Query: nenhuma
- Status: `200`

### `DELETE /roles/:id`

- Descrição: Remove uma role existente do sistema.
- Login: Sim
- Permissão: `delete:role`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `204`

### `DELETE /roles/:id/permissions/:permissionId`

- Descrição: Remove a associação de uma permissão da role informada.
- Login: Sim
- Permissão: `delete:role`
- Body: nenhum
- Params:
  - `id` (uuid)
  - `permissionId` (uuid)
- Query: nenhuma
- Status: `204`

### `DELETE /roles/:id/permissions`

- Descrição: Remove **todas as permissões associadas** à role informada.
- Login: Sim
- Permissão: `update:role`
- Body: nenhum
- Params:
  - `id` (uuid)
- Query: nenhuma
- Status: `204`

