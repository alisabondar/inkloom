'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/validation';

export interface FormState extends ActionState {
  values?: Record<string, string>;
}

const NOT_KEPT = /password/i;

// useActionState for forms that keeps what the user typed when the action fails. React resets a
// form after its action runs, so the submitted values are returned and used as field defaults.
// Passwords and files are never kept.
export function useFormAction(action: (prev: ActionState, formData: FormData) => Promise<ActionState>) {
  return useActionState(async (prev: FormState, formData: FormData): Promise<FormState> => {
    const result = await action(prev, formData);
    if (result.ok) return result;
    const values: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (typeof value === 'string' && !NOT_KEPT.test(key)) values[key] = value;
    });
    return { ...result, values };
  }, {} as FormState);
}
