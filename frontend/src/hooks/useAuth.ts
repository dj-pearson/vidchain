import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { signIn, signUp, signOut, resetPassword } from '@/lib/supabase';
import { ROUTES } from '@/config/constants';

export function useAuth() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    isLoading,
    isAuthenticated,
    error,
    initialize,
    setLoading,
    setError,
    logout: storeLogout,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await signIn(email, password);

        if (error) {
          setError(error.message);
          return { success: false, error: error.message };
        }

        if (data.user) {
          navigate(ROUTES.dashboard);
          return { success: true };
        }

        return { success: false, error: 'Login failed' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [navigate, setError, setLoading]
  );

  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await signUp(email, password, fullName);

        if (error) {
          setError(error.message);
          return { success: false, error: error.message };
        }

        if (data.user) {
          // User needs to confirm email
          return {
            success: true,
            message: 'Please check your email to confirm your account',
          };
        }

        return { success: false, error: 'Registration failed' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading]
  );

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await storeLogout();
      navigate(ROUTES.login);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  }, [navigate, setError, setLoading, storeLogout]);

  const forgotPassword = useCallback(
    async (email: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error } = await resetPassword(email);

        if (error) {
          setError(error.message);
          return { success: false, error: error.message };
        }

        return {
          success: true,
          message: 'Password reset email sent',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send reset email';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [setError, setLoading]
  );

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    forgotPassword,
  };
}

// Hook for protecting routes
export function useRequireAuth(redirectTo = ROUTES.login) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
}

// Hook for redirecting authenticated users away from auth pages
export function useRedirectAuthenticated(redirectTo = ROUTES.dashboard) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
}
