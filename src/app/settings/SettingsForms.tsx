'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/studio';
import { changePasswordAction, deleteAccountAction, exportDataAction, updateProfileAction, uploadAvatarAction } from '@/app/actions/profile';
import { Field, FormStatus } from '@/components/site/FormBits';
import { useFormAction } from '@/components/site/useFormAction';
import { MEDIUMS } from '@/lib/plan';
import type { CurrentProfile } from '@/lib/db/queries';
import styles from '../pages.module.css';

export function ProfileForm({ profile }: { profile: CurrentProfile }) {
  const [state, action, pending] = useFormAction(updateProfileAction);
  return (
    <form action={action} className={styles.form}>
      <FormStatus state={state} />
      <Field label="First name" name="first_name" defaultValue={profile.first_name ?? ''} required state={state} />
      <Field label="Username" name="username" defaultValue={profile.username ?? ''} state={state} />
      <Field label="Email" name="email" type="email" defaultValue={profile.email ?? ''} required state={state} />
      <div className={styles.field}>
        <label htmlFor="favorite_medium" className={styles.label}>Favourite medium</label>
        <select id="favorite_medium" name="favorite_medium" className={styles.select} defaultValue={state.values?.favorite_medium ?? profile.favorite_medium ?? ''} key={state.values?.favorite_medium}>
          <option value="">No favourite</option>
          {MEDIUMS.map((medium) => <option key={medium.id} value={medium.id}>{medium.label}</option>)}
        </select>
      </div>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</Button>
    </form>
  );
}

export function AvatarForm({ profile }: { profile: CurrentProfile }) {
  const [state, action, pending] = useFormAction(uploadAvatarAction);
  return (
    <form action={action} className={styles.form}>
      <FormStatus state={state} />
      <div className={styles.row}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Your avatar" className={styles.avatarPreview} /> : <div className={styles.avatarPreview} />}
        <Field label="New avatar" name="avatar" type="file" accept="image/*" required state={state} />
      </div>
      <Button type="submit" variant="paper" disabled={pending}>{pending ? 'Uploading…' : 'Upload avatar'}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useFormAction(changePasswordAction);
  return (
    <form action={action} className={styles.form}>
      <FormStatus state={state} />
      <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" required state={state} />
      <Field label="New password" name="newPassword" type="password" autoComplete="new-password" minLength={8} required state={state} />
      <Button type="submit" variant="paper" disabled={pending}>{pending ? 'Changing…' : 'Change password'}</Button>
    </form>
  );
}

export function DataControls() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const download = () =>
    startTransition(async () => {
      const data = await exportDataAction();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `inkloom-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });

  const remove = () => {
    if (!window.confirm('Delete your account, templates, and images for good? This cannot be undone.')) return;
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className={styles.form}>
      <p className={styles.muted}>Download everything as JSON: your profile, templates (with image links), and generation history.</p>
      <Button variant="paper" onClick={download} disabled={pending}>Export my data</Button>
      <div className={styles.danger}>
        {error && <div role="alert" className={styles.formError}>{error}</div>}
        <p className={styles.muted}>Deleting your account removes your profile, templates, and uploaded images.</p>
        <button type="button" className={styles.dangerButton} onClick={remove} disabled={pending}>Delete account</button>
      </div>
    </div>
  );
}
