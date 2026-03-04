const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface RequestConfig extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setUnauthorizedHandler(callback: () => void) {
    this.onUnauthorized = callback;
  }

  private getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { token, headers, ...restConfig } = config;

    // Используем переданный токен или берём из localStorage
    const authToken = token || this.getToken();

    // Проверяем является ли тело FormData
    const isFormData = restConfig.body instanceof FormData;

    const defaultHeaders: HeadersInit = {
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      // Не устанавливаем Content-Type для FormData - браузер сам добавит boundary
      ...(!isFormData && { 'Content-Type': 'application/json' }),
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...restConfig,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        
        // Обработка 401 — блокировка или истёкший токен
        if (response.status === 401) {
          console.log('[API] 401 Unauthorized:', error.message);
          localStorage.removeItem('auth_token');
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }
        
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      // Если ошибка сети (backend недоступен)
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        console.error('[API] Backend недоступен. Проверьте, запущен ли сервер на порту 3000');
        throw new Error('Сервер недоступен. Попробуйте позже.');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    // Если данные FormData, не конвертируем в JSON
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    // Если данные FormData, не конвертируем в JSON
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Глобальный обработчик 401 — редирект на логин
if (typeof window !== 'undefined') {
  api.setUnauthorizedHandler(() => {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  });
}
