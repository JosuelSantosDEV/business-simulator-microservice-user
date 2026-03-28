import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { ENV_KEYS } from "src/common/constants/env.constant";

@Injectable()
export class DbServiceConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: "postgres",
      host: this.configService.get<string>(ENV_KEYS.DB_HOST),
      port: this.configService.get<number>(ENV_KEYS.DB_PORT),
      username: this.configService.get<string>(ENV_KEYS.DB_USERNAME),
      password: this.configService.get<string>(ENV_KEYS.DB_PASSWORD),
      database: this.configService.get<string>(ENV_KEYS.DB_NAME),
      entities: [__dirname + "/../**/*.entity{.ts,.js}"],
      synchronize: this.configService.get<boolean>(ENV_KEYS.DB_SYNCHRONIZE),
      logging: ["warn", "error", "migration", "schema"],
    };
  }
}
