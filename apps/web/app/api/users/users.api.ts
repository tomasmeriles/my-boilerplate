import { apiClient } from '~/lib/axios';
import type { Page, SafeUser } from '~/lib/types';
import type { UpdateUserDto, UsersQueryParams } from './users.types';

export const usersApi = {
  getUsers: (params?: UsersQueryParams) =>
    apiClient.get<Page<SafeUser>>('/users', { params }).then((r) => r.data),

  getUserById: (id: string) =>
    apiClient.get<SafeUser>(`/users/${id}`).then((r) => r.data),

  updateUser: (id: string, dto: UpdateUserDto) =>
    apiClient.patch<SafeUser>(`/users/${id}`, dto).then((r) => r.data),

  deleteUser: (id: string) =>
    apiClient.delete(`/users/${id}`).then((r) => r.data),
};
