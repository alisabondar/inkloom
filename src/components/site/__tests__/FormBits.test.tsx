import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Field, FormStatus } from '../FormBits';
import type { FormState } from '../useFormAction';

function Form({ state }: { state: FormState }) {
  return (
    <form>
      <FormStatus state={state} />
      <Field label="Email" name="email" state={state} />
      <Field label="Password" name="password" hint="At least 8 characters" state={state} />
    </form>
  );
}

describe('Field and FormStatus', () => {
  it('shows a hint until there is an error, and links both to the input', () => {
    const { rerender } = render(<Form state={{}} />);
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 8 characters');
    rerender(<Form state={{ fieldErrors: { password: 'Password is too short' } }} />);
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Password is too short');
    expect(screen.queryByText('At least 8 characters')).toBeNull();
  });

  it('moves focus to the first field with an error after a failed submit', () => {
    render(<Form state={{ fieldErrors: { password: 'Too short' } }} />);
    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('focuses the form message when the error is not about one field', () => {
    render(<Form state={{ error: 'Wrong email or password' }} />);
    expect(screen.getByRole('alert')).toHaveFocus();
  });
});
