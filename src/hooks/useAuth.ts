'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  username: string | null;
  favorite_medium: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

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
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
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
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
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
    setUser(null);
    localStorage.removeItem('user');
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
