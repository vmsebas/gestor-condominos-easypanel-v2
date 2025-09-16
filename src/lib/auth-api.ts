import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api');

// Create axios instance with auth support
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies (refresh tokens)
});

// Token refresh promise to prevent multiple simultaneous refresh attempts
let refreshingToken: Promise<any> | null = null;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // If already refreshing, wait for it
      if (refreshingToken) {
        await refreshingToken;
        return apiClient(originalRequest);
      }
      
      // Start refresh process
      refreshingToken = refreshAccessToken();
      
      try {
        await refreshingToken;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        refreshingToken = null;
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to refresh access token
async function refreshAccessToken() {
  try {
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    
    const { accessToken } = response.data.data;
    useAuthStore.getState().setAccessToken(accessToken);
    
    return accessToken;
  } catch (error) {
    throw error;
  }
}

// Auth endpoints
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  async register(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    building_id?: string;
    member_id?: string;
  }) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  
  async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },
  
  async forgotPassword(email: string) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  async resetPassword(token: string, password: string) {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },
  
  async getSessions() {
    const response = await apiClient.get('/auth/sessions');
    return response.data;
  },
  
  async revokeSession(sessionId: string) {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  }
};

export default apiClient;