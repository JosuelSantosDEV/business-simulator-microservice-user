import { Global, Module } from "@nestjs/common";
import { HashingService } from "../services/hashing.service";
import { BcryptService } from "../services/bcrypt.service";

@Global()
@Module({
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
  exports: [HashingService],
})
export class HashingModule {}
