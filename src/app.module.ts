import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { envValidationSchema } from "./common/validations/env.validation";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { HashingModule } from "./common/modules/hashing.module";
import { APP_GUARD } from "@nestjs/core";
import { JwtAccessTokenGuard } from "./modules/auth/guards/jwt-access-token.guard";
import { PermissionModule } from "./modules/permission/permission.module";
import { RoleModule } from "./modules/role/role.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    RoleModule,
    ProfileModule,
    HashingModule,
    PermissionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAccessTokenGuard,
    },
  ],
})
export class AppModule {}
