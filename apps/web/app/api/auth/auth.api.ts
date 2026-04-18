import { apiClient, setCsrfToken } from '~/lib/axios';
import type { SafeUser } from '~/lib/types';
import type {
  AuthResponse,
  LoginDto,
  MeResponse,
  RegisterDto,
} from './auth.types';

export const authApi = {
  getMe: () => apiClient.get<MeResponse>('/auth/me').then((r) => r.data),

  login: (dto: LoginDto) =>
    apiClient.post<AuthResponse>('/auth/login', dto).then((r) => {
      setCsrfToken(r.data.csrfToken);
      return r.data.user;
    }),

  register: (dto: RegisterDto) =>
    apiClient.post<AuthResponse>('/auth/register', dto).then((r) => {
      setCsrfToken(r.data.csrfToken);
      return r.data.user;
    }),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),

  refresh: () =>
    apiClient.post<{ csrfToken: string }>('/auth/refresh').then((r) => {
      setCsrfToken(r.data.csrfToken);
    }),

  /**
   * Fetches a fresh signed CSRF token from the server and stores it in memory.
   * Call this after an OAuth redirect and on page reload when the user is
   * already authenticated (access_token cookie present but JS memory is empty).
   */
  getCsrfToken: () =>
    apiClient.get<{ csrfToken: string }>('/auth/csrf-token').then((r) => {
      setCsrfToken(r.data.csrfToken);
    }),
};
