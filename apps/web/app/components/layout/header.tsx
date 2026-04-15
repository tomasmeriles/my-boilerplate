import React from 'react';
import { useLocation } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { ThemeToggle } from '~/components/theme-toggle';
import { UserMenu } from '~/components/layout/user-menu';

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.replace(/^\//, '').split('/');
  return parts.map((part, i) => ({
    label: part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    href: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }));
}

export function AppHeader() {
  const { pathname } = useLocation();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!crumb.isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
