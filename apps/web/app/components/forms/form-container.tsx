import {
  type FieldValues,
  type UseFormReturn,
  type SubmitHandler,
} from 'react-hook-form';
import { Form } from '~/components/ui/form';
import { cn } from '~/lib/utils';

interface FormContainerProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  className?: string;
  children: React.ReactNode;
}

export function FormContainer<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: FormContainerProps<TFieldValues>) {
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => { e.stopPropagation(); void form.handleSubmit(onSubmit)(e); }}
        className={cn('space-y-4', className)}
      >
        {children}
      </form>
    </Form>
  );
}
