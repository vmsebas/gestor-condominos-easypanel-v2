import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api-v2';

export function useAuthCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const { user, accessToken, setUser, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      // If no token, we're done checking
      if (!accessToken) {
        if (mounted) setIsChecking(false);
        return;
      }

      // If we already have user data, we're done
      if (user) {
        if (mounted) setIsChecking(false);
        return;
      }

      // Try to get user data with the token
      try {
        const response = await authApi.getCurrentUser();
        if (mounted) {
          if (response.success) {
            setUser(response.data);
          } else {
            logout();
          }
        }
      } catch (error) {
        if (mounted) {
          logout();
        }
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [accessToken, user, setUser, logout]);

  return { isChecking };
}