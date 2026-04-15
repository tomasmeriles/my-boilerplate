import { Outlet } from '@tanstack/react-router';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { AppSidebar } from '~/components/layout/sidebar';
import { AppHeader } from '~/components/layout/header';

export default function AppLayout() {
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
