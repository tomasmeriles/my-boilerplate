import { Outlet } from '@tanstack/react-router';
import env from '~/env';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-2xl font-bold tracking-tight">
            {env.VITE_APP_NAME}
          </span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
