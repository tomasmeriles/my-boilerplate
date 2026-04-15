import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '~/api/auth/auth.api';
import type { LoginDto, RegisterDto } from '~/api/auth/auth.types';

export const authKeys = {
  me: () => ['auth', 'me'] as const,
};

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authApi.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Set me to null before removing other queries. clear() would evict
      // the me entry, causing useMe() to refetch /auth/me, which returns
      // 401, which triggers the refresh interceptor with no cookie -
      // producing a spurious "No refresh token provided" failed audit log.
      queryClient.setQueryData(authKeys.me(), null);
      queryClient.removeQueries({
        predicate: (q) => q.queryKey[0] !== 'auth',
      });
    },
  });
}
