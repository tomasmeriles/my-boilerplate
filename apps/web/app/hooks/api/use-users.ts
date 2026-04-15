import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '~/api/users/users.api';
import type { UpdateUserDto, UsersQueryParams } from '~/api/users/users.types';

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params?: UsersQueryParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

export function useUsers(params?: UsersQueryParams) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersApi.getUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) =>
      usersApi.updateUser(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
