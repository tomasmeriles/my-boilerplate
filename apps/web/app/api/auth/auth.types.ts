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
