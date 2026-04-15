import { useContext } from 'react';
import type { Action, Subject } from '~/lib/types';
import { AuthContext } from '~/contexts/auth';

export function usePermission(action: Action, subject: Subject): boolean {
  const ctx = useContext(AuthContext);
  return ctx?.ability?.can(action, subject) ?? false;
}
