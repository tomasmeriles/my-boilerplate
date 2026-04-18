import { createContext, useContext, useEffect, useMemo } from 'react';
import { Loader } from '~/components/ui/loader';
import { useMe } from '~/hooks/api/use-auth';
import { buildAbility, emptyAbility, type AppAbility } from '~/lib/ability';
import { hasCsrfToken } from '~/lib/axios';
import { authApi } from '~/api/auth/auth.api';
import type { SafeUser } from '~/lib/types';

export interface AuthContextValue {
  user: SafeUser | null;
  ability: AppAbility;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useMe();

  const ability = useMemo(
    () => (data?.abilities ? buildAbility(data.abilities) : emptyAbility),
    [data?.abilities],
  );

  // On page reload and after OAuth redirects the access_token cookie is present
  // but the CSRF token is not in JS memory yet. Fetch it once from the server
  // so all subsequent state-changing requests include the x-csrf-token header.
  useEffect(() => {
    if (data?.user && !hasCsrfToken()) {
      authApi.getCsrfToken();
    }
  }, [data?.user]);

  if (isLoading) {
    return <Loader fullScreen size="lg" />;
  }

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        ability,
        isLoading: false,
        isAuthenticated: !!data?.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
