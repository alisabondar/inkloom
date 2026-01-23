'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './page.module.css';

export default function AccountSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [favoriteMedium, setFavoriteMedium] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/get-user?id=${user.id}`);

      if (!response.ok) {
        console.error('Error fetching user data:', response.status);
        setEmail(user.email || '');
        setDisplayName(user.first_name || '');
        setUsername(user.username || '');
        setFavoriteMedium(user.favorite_medium || '');
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success && result.user) {
        setEmail(result.user.email || user.email || '');
        setDisplayName(result.user.first_name || '');
        setUsername(result.user.username || '');
        setFavoriteMedium(result.user.favorite_medium || '');
      } else {
        setEmail(user.email || '');
        setDisplayName(user.first_name || '');
        setUsername(user.username || '');
        setFavoriteMedium(user.favorite_medium || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setEmail(user.email || '');
      setDisplayName(user.first_name || '');
      setUsername(user.username || '');
      setFavoriteMedium(user.favorite_medium || '');
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

  if (authLoading || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.profileContent}>
          <p style={{ color: 'white', textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileContent}>
        <div className={styles.headerSection}>
          <p className={styles.pageSubtitle}>Manage your account information and settings</p>
        </div>

        <section className={styles.settingsCard}>
          <div className={styles.profileSection}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Profile Information</h2>
              {isSaving && (
                <span className={styles.savingIndicator}>Saving...</span>
              )}
            </div>

            <div className={styles.cardContent}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarLarge}>
                  <svg
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
                </div>
                <button className={styles.changeAvatarButton}>
                  Change Avatar
                </button>
              </div>

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
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Account Actions</h2>
            </div>

            <div className={styles.cardContent}>
              <button className={styles.actionButton}>
                Change Password
              </button>
              <button className={styles.actionButton}>
                Download My Data
              </button>
              <button className={styles.dangerButton}>
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

