import * as bcrypt from "bcrypt";
import { HashingService } from "src/common/services/hashing.service";
import { NUM_HASHING_SALT } from "../constants/auth.constant";

export class BcryptService extends HashingService {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(NUM_HASHING_SALT);
    return bcrypt.hash(password, salt);
  }
  async compare(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
