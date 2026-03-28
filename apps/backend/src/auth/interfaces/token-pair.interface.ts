export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Cookie maxAge in milliseconds for the refresh token */
  refreshMaxAge: number;
}
