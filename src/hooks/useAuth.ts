'use client';

import { useSyncExternalStore } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  username: string | null;
  favorite_medium: string | null;
  avatar_url?: string | null;
}

const AUTH_STORAGE_KEY = 'user';
const AUTH_STORAGE_EVENT = 'inkloom-auth-storage';

let cachedStoredUserValue: string | null | undefined;
let cachedStoredUser: User | null = null;

function getStoredUser() {
  if (typeof window === 'undefined') return null;

  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (storedUser === cachedStoredUserValue) return cachedStoredUser;

  cachedStoredUserValue = storedUser;
  if (!storedUser) {
    cachedStoredUser = null;
    return null;
  }

  try {
    cachedStoredUser = JSON.parse(storedUser) as User;
    return cachedStoredUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    cachedStoredUserValue = null;
    cachedStoredUser = null;
    return null;
  }
}

function subscribeToAuthStore(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(AUTH_STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(AUTH_STORAGE_EVENT, callback);
  };
}

function emitAuthStoreChange() {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

function storeUser(user: User) {
  const serializedUser = JSON.stringify(user);
  cachedStoredUserValue = serializedUser;
  cachedStoredUser = user;
  localStorage.setItem(AUTH_STORAGE_KEY, serializedUser);
  emitAuthStoreChange();
}

function clearStoredUser() {
  cachedStoredUserValue = null;
  cachedStoredUser = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthStoreChange();
}

export const useAuth = () => {
  const user = useSyncExternalStore(subscribeToAuthStore, getStoredUser, () => null);
  const loading = false;

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
    clearStoredUser();
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
