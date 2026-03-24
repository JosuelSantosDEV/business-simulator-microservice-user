import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DbServiceConfig } from "../config/db-service.config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: DbServiceConfig,
    }),
  ],
})
export class DatabaseModule {}
