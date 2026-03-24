export interface JwtPayloadInterface {
  sub: string;
  iat?: number;
  exp?: number;
  aud?: string;
  iss?: string;
}
