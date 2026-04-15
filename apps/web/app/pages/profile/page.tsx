import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { useAuth } from '~/contexts/auth';
import { useUpdateUser } from '~/hooks/api/use-users';
import {
  updateProfileSchema,
  type UpdateProfileFormValues,
} from '~/lib/schemas/profile.schema';
import { getApiErrorMessage } from '~/lib/axios';

export default function ProfilePage() {
  const { user } = useAuth();
  const { mutate: updateUser, isPending } = useUpdateUser();

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', avatar: '' },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name ?? '', avatar: user.avatar ?? '' });
    }
  }, [user, form]);

  const onSubmit = (values: UpdateProfileFormValues) => {
    if (!user) return;
    updateUser(
      {
        id: user.id,
        dto: { name: values.name, avatar: values.avatar || undefined },
      },
      {
        onSuccess: () => toast.success('Profile updated successfully'),
        onError: (err) =>
          toast.error(getApiErrorMessage(err, 'Failed to update profile')),
      },
    );
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={user.avatar ?? undefined}
                alt={user.name ?? user.email}
              />
              <AvatarFallback className="text-lg">
                {(user.name ?? user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.name ?? 'Unnamed User'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant="secondary" className="mt-1">
                {user.globalRole.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/avatar.png"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
