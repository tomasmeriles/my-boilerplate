import { toast } from 'sonner';
import type { UseMutationResult } from '@tanstack/react-query';
import { useApiError } from '~/hooks/use-api-error';

interface MutationToastMessages {
  success: string;
}

export function useMutationWithToast<TData, TError, TVariables>(
  mutation: UseMutationResult<TData, TError, TVariables>,
  messages: MutationToastMessages,
) {
  const apiError = useApiError();

  return (variables: TVariables, onSuccess?: (data: TData) => void) => {
    mutation.mutate(variables, {
      onSuccess: (data) => {
        toast.success(messages.success);
        onSuccess?.(data);
      },
      onError: (err) => toast.error(apiError(err as Error)),
    });
  };
}
