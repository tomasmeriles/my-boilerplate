import { useState, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import type {
  FieldValues,
  UseFormReturn,
  SubmitHandler,
  FieldPath,
} from 'react-hook-form';

export interface UseSteppedFormOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  /** Fields to validate per step (0-indexed) */
  stepFields: FieldPath<T>[][];
  onSubmit: SubmitHandler<T>;
  /** Return true when the given step passes its client-side validity check */
  isStepValid?: (step: number) => boolean;
}

export interface UseSteppedFormReturn {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  /** Whether the current step satisfies its validity check */
  isCurrentStepValid: boolean;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  goToStep: (step: number) => void;
}

/**
 * Manages multi-step form state and wires keyboard shortcuts via
 * react-hotkeys-hook:
 *
 * - `Enter`          in text/select inputs → advance step or submit (last step)
 * - `Mod + Enter`    anywhere (incl. textarea) → advance step or submit
 * - `Escape`         anywhere → go back one step
 */
export function useSteppedForm<T extends FieldValues>({
  form,
  stepFields,
  onSubmit,
  isStepValid,
}: UseSteppedFormOptions<T>): UseSteppedFormReturn {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = stepFields.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isCurrentStepValid = isStepValid ? isStepValid(currentStep) : true;

  const handleNext = useCallback(async () => {
    const fields = stepFields[currentStep];
    const valid = await form.trigger(fields);
    if (valid) setCurrentStep((s) => s + 1);
  }, [form, stepFields, currentStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const advance = useCallback(() => {
    // Blur the focused element first so any open Popovers/dropdowns
    // detect the outside interaction and close before the step changes.
    (document.activeElement as HTMLElement | null)?.blur();
    if (isLastStep) {
      void form.handleSubmit(onSubmit)();
    } else {
      void handleNext();
    }
  }, [isLastStep, form, onSubmit, handleNext]);

  // Enter in text / select inputs → advance or submit
  useHotkeys('enter', advance, {
    enableOnFormTags: ['INPUT', 'SELECT'],
    preventDefault: true,
  });

  // Mod+Enter (Ctrl on Win/Linux, Cmd on Mac) anywhere incl. textarea
  useHotkeys('mod+enter', advance, {
    enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
    preventDefault: true,
  });

  // Escape → go back one step
  useHotkeys('escape', handleBack, {
    enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
    enabled: !isFirstStep,
  });

  return {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    isCurrentStepValid,
    handleNext,
    handleBack,
    goToStep,
  };
}
