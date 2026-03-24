export interface JwtConfigInterface {
  secret: string;
  refreshSecret: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
  audience: string;
  issuer: string;
}
