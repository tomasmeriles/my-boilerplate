import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
