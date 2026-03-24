import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UsersRepository } from "./user.repository";
import { UserEntity } from "./entity/user.entity";
import { RoleModule } from "../role/role.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), RoleModule],
  providers: [UserService, UsersRepository],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
