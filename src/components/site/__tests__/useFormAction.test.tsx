import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field, FormStatus } from '../FormBits';
import { useFormAction } from '../useFormAction';
import type { ActionState } from '@/lib/validation';

function TestForm({ action }: { action: (prev: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction] = useFormAction(action);
  return (
    <form action={formAction}>
      <FormStatus state={state} />
      <Field label="Email" name="email" state={state} />
      <Field label="Password" name="password" type="password" state={state} />
      <button type="submit">Send</button>
    </form>
  );
}

describe('useFormAction', () => {
  it('keeps typed values (except passwords) when the action returns an error', async () => {
    const action = vi.fn(async () => ({ error: 'Wrong email or password' }));
    render(<TestForm action={action} />);

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Wrong email or password'));
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });
});
