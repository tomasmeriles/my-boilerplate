import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, Users, ScrollText, UserCircle } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import { useAuth } from '~/contexts/auth';
import type { Action, Subject } from '~/lib/types';
import env from '~/env';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  ability?: { action: Action; subject: Subject };
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Profile', href: '/profile', icon: UserCircle },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
    ability: { action: 'manage', subject: 'User' },
  },
  {
    title: 'Audit Logs',
    href: '/audit/logs',
    icon: ScrollText,
    ability: { action: 'read', subject: 'AuditLog' },
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { ability } = useAuth();

  const visibleItems = navItems.filter((item) =>
    item.ability
      ? ability.can(item.ability.action, item.ability.subject)
      : true,
  );

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <span className="font-bold text-lg">{env.VITE_APP_NAME}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
