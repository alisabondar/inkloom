'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

function preloadImage(src: string) {
  if (!src) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const image = new window.Image();
    const timeout = window.setTimeout(() => resolve(false), 6000);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };

    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };

    image.src = src;
  });
}

export default function AccountSettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [favoriteMedium, setFavoriteMedium] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/get-user?id=${user.id}`);
      let nextEmail = user.email || '';
      let nextDisplayName = user.first_name || '';
      let nextUsername = user.username || '';
      let nextFavoriteMedium = user.favorite_medium || '';
      let nextAvatarUrl = user.avatar_url || '';

      if (!response.ok) {
        console.error('Error fetching user data:', response.status);
      } else {
        const result = await response.json();

        if (result.success && result.user) {
          nextEmail = result.user.email || user.email || '';
          nextDisplayName = result.user.first_name || '';
          nextUsername = result.user.username || '';
          nextFavoriteMedium = result.user.favorite_medium || '';
          nextAvatarUrl = result.user.avatar_url || '';
        }
      }

      const avatarLoaded = await preloadImage(nextAvatarUrl);
      setEmail(nextEmail);
      setDisplayName(nextDisplayName);
      setUsername(nextUsername);
      setFavoriteMedium(nextFavoriteMedium);
      setAvatarUrl(avatarLoaded ? nextAvatarUrl : '');
    } catch (error) {
      console.error('Error fetching user data:', error);
      setEmail(user.email || '');
      setDisplayName(user.first_name || '');
      setUsername(user.username || '');
      setFavoriteMedium(user.favorite_medium || '');
      const avatarLoaded = await preloadImage(user.avatar_url || '');
      setAvatarUrl(avatarLoaded ? user.avatar_url || '' : '');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/');
        return;
      }
      fetchUserData();
    }
  }, [user, authLoading, router, fetchUserData]);

  const handleSave = async () => {
    if (isSaving || !user?.id) return;
    setIsSaving(true);

    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: email || user.email,
          first_name: displayName,
          username: username,
          favorite_medium: favoriteMedium || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error saving user data:', response.status, errorData);
        alert('Failed to save changes. Please try again.');
      } else {
        const result = await response.json();
        if (result.success && result.user) {
          const updatedUser = { ...user, ...result.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      handleSave();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || isUploadingAvatar) return;

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('avatar', file);

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Failed to upload avatar. Please try again.');
        return;
      }

      const nextAvatarUrl = result.avatar_url || '';
      const avatarLoaded = await preloadImage(nextAvatarUrl);
      setAvatarUrl(avatarLoaded ? nextAvatarUrl : '');

      if (result.user) {
        localStorage.setItem('user', JSON.stringify({ ...user, ...result.user }));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const openPasswordModal = () => {
    if (!user?.id || activeAction) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (activeAction === 'password') return;
    setIsPasswordModalOpen(false);
    setPasswordError('');
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || activeAction) return;

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordError('');
    setActiveAction('password');
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPasswordError(result.error || 'Failed to change password. Please try again.');
        return;
      }

      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDownloadMyData = async () => {
    if (!user?.id || activeAction) return;

    setActiveAction('download');
    try {
      const response = await fetch(`/api/export-user-data?id=${user.id}`);
      const exportData = await response.json();

      if (!response.ok) {
        alert(exportData.error || 'Failed to download account data.');
        return;
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = (username || displayName || 'inkloom-account')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]/g, '')
        .toLowerCase();

      link.href = url;
      link.download = `${safeName || 'inkloom-account'}-data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading account data:', error);
      alert('Failed to download account data.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id || activeAction) return;

    const confirmed = window.confirm('Delete your Inkloom account? This cannot be undone.');
    if (!confirmed) return;

    setActiveAction('delete');
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(result.error || 'Failed to delete account. Please try again.');
        return;
      }

      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setActiveAction(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingPanel}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileContent}>
        <section className={styles.settingsCard}>
          <aside className={styles.profileSummary}>
            <p className={styles.summaryEyebrow}>Account</p>
            <div className={styles.profileIdentity}>
              <div className={styles.avatarLarge}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.avatarImage} src={avatarUrl} alt="" />
                ) : (
                  <svg
                    className={styles.avatarIcon}
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 14C7.58172 14 4 16.6863 4 20V22H20V20C20 16.6863 16.4183 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                )}
                <input
                  ref={avatarInputRef}
                  className={styles.avatarInput}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <button
                  className={styles.editAvatarButton}
                  type="button"
                  aria-label="Edit avatar"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <svg
                    className={styles.editAvatarIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 20H21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16.5 3.5C16.8978 3.10218 17.4374 2.87868 18 2.87868C18.5626 2.87868 19.1022 3.10218 19.5 3.5C19.8978 3.89782 20.1213 4.43739 20.1213 5C20.1213 5.56261 19.8978 6.10218 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div>
                <h2 className={styles.summaryName}>
                  {displayName || username || 'Your profile'}
                </h2>
                <p className={styles.summaryEmail}>{email}</p>
              </div>
            </div>
          </aside>

          <div className={styles.settingsMain}>
            <div className={styles.profileSection}>
              <div className={styles.panelKicker}>Profile</div>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>Personal details</h2>
                  <p className={styles.cardDescription}>
                    Keep your artist profile and preferences up to date.
                  </p>
                </div>
                {isSaving && (
                  <span className={styles.savingIndicator}>Saving...</span>
                )}
              </div>

              <div className={styles.cardContent}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your first name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Username</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your email"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Favorite Medium</label>
                  <select
                    className={`${styles.select} ${!favoriteMedium ? styles.selectPlaceholder : ''}`}
                    value={favoriteMedium}
                    onChange={(e) => {
                      setFavoriteMedium(e.target.value);
                      handleSave();
                    }}
                  >
                    <option value="">Select medium</option>
                    <option value="painting">Painting</option>
                    <option value="cross-stitch">Cross-Stitch</option>
                  </select>
                </div>
              </div>
            </div>

          <div className={styles.actionsSection}>
            <div className={styles.panelKicker}>Security</div>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Account Actions</h2>
                <p className={styles.cardDescription}>
                  Manage your password, exports, and account lifecycle.
                </p>
              </div>
            </div>

            <div className={styles.cardContent}>
              <button
                className={styles.actionButton}
                type="button"
                disabled={activeAction !== null}
                onClick={openPasswordModal}
              >
                {activeAction === 'password' ? 'Updating...' : 'Change Password'}
              </button>
              <button
                className={styles.actionButton}
                type="button"
                disabled={activeAction !== null}
                onClick={handleDownloadMyData}
              >
                {activeAction === 'download' ? 'Downloading...' : 'Download My Data'}
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                disabled={activeAction !== null}
                onClick={handleDeleteAccount}
              >
                {activeAction === 'delete' ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
          </div>
        </section>
      </div>
      {isPasswordModalOpen && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={closePasswordModal}>
          <section
            className={styles.passwordModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalCloseButton}
              type="button"
              aria-label="Close password modal"
              disabled={activeAction === 'password'}
              onClick={closePasswordModal}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className={styles.modalHeader}>
              <h2 id="change-password-title" className={styles.modalTitle}>
                Change password
              </h2>
            </div>
            <form className={styles.passwordForm} onSubmit={handleChangePassword}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="current-password">
                  Current Password
                </label>
                <input
                  id="current-password"
                  className={styles.input}
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="new-password">
                  New Password
                </label>
                <input
                  id="new-password"
                  className={styles.input}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  className={styles.input}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              {passwordError && (
                <p className={styles.modalError}>{passwordError}</p>
              )}
              <div className={styles.modalActions}>
                <button
                  className={styles.modalCancelButton}
                  type="button"
                  disabled={activeAction === 'password'}
                  onClick={closePasswordModal}
                >
                  Cancel
                </button>
                <button
                  className={styles.saveButton}
                  type="submit"
                  disabled={activeAction === 'password'}
                >
                  {activeAction === 'password' ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
