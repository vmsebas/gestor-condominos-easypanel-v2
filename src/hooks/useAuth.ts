import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/lib/api-v2';
import { useAuthStore, hasRole, hasPermission, canAccessBuilding } from '@/store/authStore';

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout, updateUser } = useAuthStore();

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.success) {
        const { user, accessToken } = response.data;
        login(user, accessToken);
        toast.success('¡Bienvenido!');
        navigate('/dashboard');
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(message);
      return false;
    }
  }, [login, navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/login');
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      // Even if the API call fails, log out locally
      logout();
      navigate('/login');
    }
  }, [logout, navigate]);

  const handleRegister = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    building_id?: string;
    member_id?: string;
  }) => {
    try {
      const response = await authApi.register(data);
      if (response.success) {
        const { user, accessToken } = response.data;
        login(user, accessToken);
        toast.success('¡Registro exitoso! Bienvenido');
        navigate('/dashboard');
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al registrar usuario';
      toast.error(message);
      return false;
    }
  }, [login, navigate]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const response = await authApi.changePassword(currentPassword, newPassword);
      if (response.success) {
        toast.success('Contraseña actualizada exitosamente');
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al cambiar contraseña';
      toast.error(message);
      return false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success) {
        updateUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [updateUser]);

  return {
    user,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    changePassword,
    refreshUser,
    hasRole,
    hasPermission,
    canAccessBuilding,
  };
}

// Hook for checking permissions
export function usePermission(permission: string) {
  const { user } = useAuthStore();
  
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  
  return user.permissions?.[permission] || false;
}

// Hook for checking roles
export function useRole() {
  const { user } = useAuthStore();
  
  return {
    isSuperAdmin: user?.role === 'super_admin',
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isManager: ['manager', 'admin', 'super_admin'].includes(user?.role || ''),
    isMember: user?.role === 'member',
    role: user?.role,
  };
}

// Hook for building access
export function useBuildingAccess(buildingId?: string) {
  const { user } = useAuthStore();
  
  if (!user || !buildingId) return false;
  if (user.role === 'super_admin') return true;
  
  return user.buildingId === buildingId;
}