'use client';

import Link from 'next/link';
import { Button } from '@/components/studio';
import { requestPasswordResetAction, setNewPasswordAction, signInAction, signUpAction } from '@/app/actions/auth';
import { Field, FormStatus } from './FormBits';
import { useFormAction } from './useFormAction';
import styles from '@/app/pages.module.css';

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useFormAction(signInAction);
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      <FormStatus state={state} />
      <Field label="Email or username" name="identifier" autoComplete="username" required state={state} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required state={state} />
      <div className={styles.row} style={{ justifyContent: 'space-between' }}>
        <Button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button>
        <Link href="/reset" className={styles.link}>Forgot password?</Link>
      </div>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useFormAction(signUpAction);
  if (state.ok && state.message) return <FormStatus state={state} />;
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      <FormStatus state={state} />
      <Field label="First name" name="first_name" autoComplete="given-name" required state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" required state={state} />
      <Field label="Username (optional)" name="username" autoComplete="username" state={state} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required state={state} />
      <Button type="submit" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</Button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useFormAction(requestPasswordResetAction);
  return (
    <form action={action} className={styles.form}>
      <FormStatus state={state} />
      <Field label="Email" name="email" type="email" autoComplete="email" required state={state} />
      <Button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send reset link'}</Button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useFormAction(setNewPasswordAction);
  return (
    <form action={action} className={styles.form}>
      <FormStatus state={state} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required state={state} />
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Set new password'}</Button>
    </form>
  );
}
