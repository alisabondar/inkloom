'use client';

import { useSyncExternalStore } from 'react';

interface User {
  id: string | number;
  email: string;
  first_name: string | null;
  username: string | null;
  favorite_medium: string | null;
  avatar_url?: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

// Identity comes from the server session (httpOnly cookies); this store only mirrors it for rendering.
let authState: AuthState = { user: null, loading: true };
let sessionRequest: Promise<void> | null = null;
const listeners = new Set<() => void>();
const SERVER_STATE: AuthState = { user: null, loading: true };

function setAuthState(next: AuthState) {
  authState = next;
  listeners.forEach((listener) => listener());
}

function loadSession() {
  if (!sessionRequest) {
    sessionRequest = fetch('/api/get-user')
      .then(async (response) => {
        const result = response.ok ? await response.json() : null;
        setAuthState({ user: result?.success ? result.user : null, loading: false });
      })
      .catch(() => {
        setAuthState({ user: null, loading: false });
      });
  }
  return sessionRequest;
}

function subscribeToAuthStore(callback: () => void) {
  listeners.add(callback);
  loadSession();
  return () => {
    listeners.delete(callback);
  };
}

function getAuthState() {
  return authState;
}

function getServerAuthState() {
  return SERVER_STATE;
}

function storeUser(user: User) {
  setAuthState({ user, loading: false });
}

function clearStoredUser() {
  setAuthState({ user: null, loading: false });
}

export const useAuth = () => {
  const { user, loading } = useSyncExternalStore(subscribeToAuthStore, getAuthState, getServerAuthState);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: result.error || 'Sign in failed' },
        };
      }

      if (result.success && result.user) {
        storeUser(result.user);
        return { data: { user: result.user }, error: null };
      }

      return {
        data: null,
        error: { message: 'Sign in failed' },
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Sign in failed' },
      };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, username?: string) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name: firstName, username }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: { message: result.error || 'Sign up failed' },
        };
      }

      if (result.success && result.needsConfirmation) {
        return {
          data: null,
          error: { message: 'Check your email to confirm your account, then sign in.' },
        };
      }

      if (result.success && result.user) {
        storeUser(result.user);
        return { data: { user: result.user }, error: null };
      }

      return {
        data: null,
        error: { message: 'Sign up failed' },
      };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Sign up failed' },
      };
    }
  };

  const signOut = async () => {
    await fetch('/api/signout', { method: 'POST' }).catch(() => undefined);
    clearStoredUser();
  };

  const updateUser = (changes: Partial<User>) => {
    if (authState.user) storeUser({ ...authState.user, ...changes });
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
  };
};
