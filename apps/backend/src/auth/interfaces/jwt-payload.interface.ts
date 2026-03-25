export interface JwtPayload {
  /** User primary key (cuid) */
  sub: string;
  email: string;
}
