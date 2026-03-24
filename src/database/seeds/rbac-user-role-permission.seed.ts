import { PermissionAction } from "src/common/enums/permission-action.enum";
import { PermissionResource } from "src/common/enums/permission-resource.enum";
import { PermissionEntity } from "src/modules/permission/entity/permission.entity";
import { RoleEntity } from "src/modules/role/entity/role.entity";
import { DataSource } from "typeorm";
export async function seedRbac(dataSource: DataSource) {
  const permissionRepo = dataSource.getRepository(PermissionEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);

  // 1. Gera todas as combinações de action + resource
  const permissionsToCreate: Partial<PermissionEntity>[] = [];

  for (const resource of Object.values(PermissionResource)) {
    for (const action of Object.values(PermissionAction)) {
      permissionsToCreate.push({
        action,
        resource,
        name: `${action}:${resource}`,
        description: `Pode ${action} em ${resource}`,
      });
    }
  }

  // upsert para não duplicar ao rodar o seed novamente
  await permissionRepo.upsert(permissionsToCreate, ["name"]);
  const allPermissions = await permissionRepo.find();

  const getPerms = (...names: string[]) =>
    allPermissions.filter((p) => names.includes(p.name));

  // 2. Cria as roles do sistema
  const roles = [
    {
      name: "system_admin",
      description: "Acesso total ao sistema",
      isSystem: true,
      isDefault: false,
      permissions: allPermissions, // todas as permissões
    },
    {
      name: "admin",
      description: "Gerencia usuários e roles",
      isSystem: false,
      isDefault: false,
      permissions: getPerms(
        "create:user",
        "read:user",
        "update:user",
        "delete:user",
        "read:role",
        "read:permission",
      ),
    },
    {
      name: "user",
      description: "Usuário padrão",
      isSystem: false,
      isDefault: true, // atribuída automaticamente no registro
      permissions: getPerms("read:user", "update:user"),
    },
  ];

  for (const roleData of roles) {
    await roleRepo.upsert(
      {
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        isDefault: roleData.isDefault,
      },
      ["name"],
    );
    const role = await roleRepo.findOneBy({ name: roleData.name });
    role.permissions = roleData.permissions;
    await roleRepo.save(role);
  }

  console.log("✅ RBAC seed concluído");
}
