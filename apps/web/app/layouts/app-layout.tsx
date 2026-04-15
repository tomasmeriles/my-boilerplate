import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { AppSidebar } from '~/components/layout/sidebar';
import { AppHeader } from '~/components/layout/header';
import { useAuth } from '~/contexts/auth';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Navigate to /login after the render where isAuthenticated becomes false.
  // We cannot rely on the mutation's onSuccess callback because React 18
  // batches the setQueryData state update, so the router context is still
  // stale when navigate() is called there  -causing authLayoutRoute.beforeLoad
  // to see isAuthenticated=true and redirect back to /dashboard.
  // useEffect runs after the commit, so the context is always up-to-date here.
  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: '/login', replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col gap-4 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
