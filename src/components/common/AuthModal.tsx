'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [accountNotFoundMessage, setAccountNotFoundMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!firstName.trim()) {
          setError('First name is required');
          setLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await signUp(email, password, firstName, username.trim() || undefined);
        if (signUpError) {
          setError(signUpError.message);
        } else if (signUpData?.user) {
          onClose();
          setEmail('');
          setPassword('');
          setFirstName('');
          setUsername('');
          router.push('/account-settings');
        }
      } else {
        const isEmail = email.includes('@');
        let userExists = false;

        if (email && email.trim()) {
          try {
            const response = await fetch('/api/check-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(isEmail ? { email: email.trim() } : { username: email.trim() }),
            });

            if (!response.ok) {
            } else {
              const result = await response.json();
              if (result.success) {
                userExists = result.exists;
              }
            }
          } catch {
          }
        }

        if (!userExists) {
          setAccountNotFoundMessage('Account not found. Would you like to create an account?');
          const inputValue = email.trim();
          if (!inputValue.includes('@')) {
            setUsername(inputValue);
            setEmail('');
          }
          setIsSignUp(true);
          setLoading(false);
          return;
        }

        const { data: signInData, error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message);
        } else if (signInData?.user) {
          onClose();
          setEmail('');
          setPassword('');
          router.push('/account-settings');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = isSignUp
    ? firstName.trim() && email.trim() && password.length >= 6
    : email.trim() && password.length >= 6;

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setUsername('');
    setError(null);
    setAccountNotFoundMessage(null);
    setIsSignUp(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={handleClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className={styles.title}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>

        {accountNotFoundMessage && (
          <div className={styles.infoMessage} style={{ marginBottom: '1rem' }}>
            {accountNotFoundMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>First Name <span style={{ color: '#fca5a5' }}>*</span></label>
                <input
                  type="text"
                  className={styles.input}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Username</label>
                <input
                  type="text"
                  className={styles.input}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {isSignUp ? 'Email' : 'Email or Username'}{' '}
              <span style={{ color: '#fca5a5' }}>*</span>
            </label>
            <input
              type={isSignUp ? 'email' : 'text'}
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isSignUp ? 'Enter your email' : 'Enter your email or username'}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password <span style={{ color: '#fca5a5' }}>*</span></label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className={error.includes('create an account') ? styles.infoMessage : styles.error}>
              {error}
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={loading || !isFormValid}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>

          <div className={styles.switch}>
            <span>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              type="button"
              className={styles.switchButton}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setAccountNotFoundMessage(null);
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

