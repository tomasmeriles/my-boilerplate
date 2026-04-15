import { Link } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-20">
      <p className="text-2xl font-semibold">403</p>
      <p className="text-muted-foreground">
        You don't have permission to view this page.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
