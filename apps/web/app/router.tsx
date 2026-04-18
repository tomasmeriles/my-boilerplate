import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { lazy } from 'react';

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/router-devtools').then((m) => ({
        default: m.TanStackRouterDevtools,
      })),
    );
import AuthLayout from '~/layouts/auth-layout';
import AppLayout from '~/layouts/app-layout';
import IndexPage from '~/pages/index/page';
import LoginPage from '~/pages/auth/login/page';
import RegisterPage from '~/pages/auth/register/page';
import ForgotPasswordPage from '~/pages/auth/forgot-password/page';
import ResetPasswordPage from '~/pages/auth/reset-password/page';
import DashboardPage from '~/pages/dashboard/page';
import ProfilePage from '~/pages/profile/page';
import UsersPage from '~/pages/users/page';
import UserDetailPage from '~/pages/users/[id]/page';
import AuditLogsPage from '~/pages/audit/logs/page';
import ForbiddenPage from '~/pages/forbidden/page';
import NotFoundPage from '~/pages/not-found/page';
import type { AuthContextValue } from '~/contexts/auth';

interface RouterContext {
  auth: AuthContextValue;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: NotFoundPage,
});

// ─── Index ────────────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

// ─── Auth layout (public) ─────────────────────────────────────────────────────

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/register',
  component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/reset-password',
  component: ResetPasswordPage,
});

// ─── App layout (protected) ───────────────────────────────────────────────────

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: ProfilePage,
});

const usersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users',
  component: UsersPage,
  beforeLoad: ({ context }) => {
    if (!context.auth.ability.can('read', 'User')) {
      throw redirect({ to: '/403' });
    }
  },
});

const userDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/users/$id',
  component: UserDetailPage,
});

const auditLogsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/audit/logs',
  component: AuditLogsPage,
  beforeLoad: ({ context }) => {
    if (!context.auth.ability.can('read', 'AuditLog')) {
      throw redirect({ to: '/403' });
    }
  },
});

const forbiddenRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/403',
  component: ForbiddenPage,
});

// ─── Route tree ───────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  authLayoutRoute.addChildren([
    loginRoute,
    registerRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
  ]),
  appLayoutRoute.addChildren([
    dashboardRoute,
    profileRoute,
    usersRoute,
    userDetailRoute,
    auditLogsRoute,
    forbiddenRoute,
  ]),
]);

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createRouter({
  routeTree,
  context: { auth: undefined! },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
