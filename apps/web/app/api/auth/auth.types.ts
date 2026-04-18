import type { PackedAbility, SafeUser } from '~/lib/types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  name: string;
  password: string;
}

export interface MeResponse {
  user: SafeUser;
  abilities: PackedAbility[];
}

/** Shape returned by login and register */
export interface AuthResponse {
  user: SafeUser;
  csrfToken: string;
}
