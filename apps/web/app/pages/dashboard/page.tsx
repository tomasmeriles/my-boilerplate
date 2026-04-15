import { useAuth } from '~/contexts/auth';
import { formatDate } from '~/lib/datetime';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-destructive text-destructive-foreground',
  TENANT_MANAGER: 'bg-warning text-warning-foreground',
  MEMBER: 'bg-secondary text-secondary-foreground',
};

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your workspace.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Your role:</span>
        <Badge className={roleColors[user?.globalRole ?? 'MEMBER']}>
          {user?.globalRole?.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user?.email}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Joined {user ? formatDate(user.createdAt) : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {user?.emailVerifiedAt ? '✓ Yes' : '✗ No'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
