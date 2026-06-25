import { getApiErrorMessage } from '~/lib/axios';

export function useApiError() {
  return getApiErrorMessage;
}
