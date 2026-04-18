import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import env from '~/env';
import type { ApiError } from '~/lib/types';

export const apiClient = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── CSRF token (in-memory) ────────────────────────────────────────────────────
// Stored in JS memory — not accessible to other origins.
// Set after login/register/refresh; read by the request interceptor.

let csrfToken: string | null = null;

export function setCsrfToken(token: string): void {
  csrfToken = token;
}

export function hasCsrfToken(): boolean {
  return csrfToken !== null;
}

export function clearCsrfToken(): void {
  csrfToken = null;
}

// ─── Refresh state ────────────────────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue(error: unknown) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  pendingQueue = [];
}

// ─── Request interceptor ──────────────────────────────────────────────────────
// 1. Forwards tenantId as a header when provided in config.
// 2. Injects the CSRF token for state-changing requests.

const SAFE_METHODS = new Set(['get', 'head', 'options']);

apiClient.interceptors.request.use((config) => {
  const tenantId = (
    config as InternalAxiosRequestConfig & { tenantId?: string }
  ).tenantId;
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }

  if (csrfToken && !SAFE_METHODS.has(config.method?.toLowerCase() ?? '')) {
    config.headers['x-csrf-token'] = csrfToken;
  }

  return config;
});

// ─── Response interceptor: 401 -> refresh -> retry ────────────────────────────

const SKIP_REFRESH = ['/auth/refresh', '/auth/login', '/auth/register'];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const shouldRetry =
      error.response?.status === 401 &&
      !original?._retry &&
      !SKIP_REFRESH.some((url) => original?.url?.includes(url));

    if (!shouldRetry) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => {
        original._retry = true;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await apiClient.post<{ csrfToken: string }>(
        '/auth/refresh',
      );
      setCsrfToken(data.csrfToken);
      drainQueue(null);
      return apiClient(original);
    } catch (refreshError) {
      drainQueue(refreshError);
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login'
      ) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getApiErrorMessage(
  error: unknown,
  fallback = 'An error occurred',
): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiError | undefined)?.message ?? fallback;
  }
  return fallback;
}
