import { SetMetadata } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "src/common/constants/auth.constant";

export const PublicRoute = () => SetMetadata(IS_PUBLIC_KEY, true);
