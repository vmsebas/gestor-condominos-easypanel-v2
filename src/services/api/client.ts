import axios, { AxiosInstance } from 'axios';

// Crear instancia de axios con configuración base
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('API Error:', error.response.data);
      
      // Personalizar mensajes de error según el código
      switch (error.response.status) {
        case 401:
          // Manejar no autorizado
          break;
        case 404:
          error.message = 'Recurso no encontrado';
          break;
        case 500:
          error.message = 'Error del servidor. Por favor, intente más tarde.';
          break;
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      error.message = 'No se pudo conectar con el servidor';
    }
    
    return Promise.reject(error);
  }
);

// Función helper para manejar respuestas
export const handleApiResponse = <T>(response: any): T => {
  if (response.data.success === false) {
    throw new Error(response.data.error || 'Error desconocido');
  }
  return response.data.data || response.data;
};

export default apiClient;