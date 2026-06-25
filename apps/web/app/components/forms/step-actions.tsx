import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { LoadingButton } from '~/components/buttons';
import { cn } from '~/lib/utils';

export interface StepActionsProps {
  onNext?: () => void;
  onBack?: () => void;
  isSubmit?: boolean;
  /** Label for the submit button. Defaults to "Submit". */
  submitLabel?: string;
  /** Icon rendered next to the submit label. */
  submitIcon?: LucideIcon;
  isPending?: boolean;
  disabled?: boolean;
  className?: string;
}

export function StepActions({
  onNext,
  onBack,
  isSubmit = false,
  submitLabel = 'Submit',
  submitIcon: SubmitIcon,
  isPending = false,
  disabled = false,
  className,
}: StepActionsProps) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 pt-1', className)}
    >
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
      ) : (
        <div />
      )}

      {isSubmit ? (
        <LoadingButton
          type="submit"
          isLoading={isPending}
          loadingText={submitLabel}
          className="gap-1.5"
        >
          {submitLabel}
          {SubmitIcon && <SubmitIcon className="h-3.5 w-3.5" />}
        </LoadingButton>
      ) : (
        <Button
          type="button"
          onClick={() => {
            (document.activeElement as HTMLElement | null)?.blur();
            onNext?.();
          }}
          size="sm"
          disabled={disabled}
          className="gap-1.5"
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
