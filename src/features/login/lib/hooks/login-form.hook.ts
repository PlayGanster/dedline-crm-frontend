import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/shared/api/api.client';
import { useAuthStore } from '@/features/auth';
import { useUserStore } from '@/entities/user/model/user.store';
import { useNotification } from '@/features/notification';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar?: string;
  };
}

export const useLoginForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser } = useAuthStore();
  const { setUser: setUserData } = useUserStore();
  const { success, error: notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', data);

      setToken(response.access_token);
      setUser(response.user);

      // Сохраняем данные пользователя в user store
      setUserData({
        id: response.user.id,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        role: (response.user.role || 'MANAGER').toLowerCase() as any,
        avatar: response.user.avatar || '',
        created_at: Date.now(),
        is_active: 1,
      });

      // Редирект на страницу, с которой пришли, или на главную
      const redirect = searchParams.get('redirect');
      let redirectTo = '/';
      
      if (redirect) {
        const decoded = decodeURIComponent(redirect);
        // Избегаем редиректа на login/reset-password
        if (!decoded.startsWith('/login') && !decoded.startsWith('/reset-password')) {
          redirectTo = decoded;
        }
      }
      
      success('С возвращением!', `Добро пожаловать, ${response.user.first_name}!`);
      navigate(redirectTo);
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при входе';
      setError(errorMessage);
      notifyError('Ошибка входа', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading,
    error,
  };
};
