import { apiClient } from '~/lib/axios';
import type { SafeUser } from '~/lib/types';
import type { LoginDto, MeResponse, RegisterDto } from './auth.types';

export const authApi = {
  getMe: () => apiClient.get<MeResponse>('/auth/me').then((r) => r.data),

  login: (dto: LoginDto) =>
    apiClient.post<SafeUser>('/auth/login', dto).then((r) => r.data),

  register: (dto: RegisterDto) =>
    apiClient.post<SafeUser>('/auth/register', dto).then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),

  refresh: () => apiClient.post('/auth/refresh').then((r) => r.data),
};
