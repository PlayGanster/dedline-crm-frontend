import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/api.client';
import { useNotification } from '@/features/notification';

interface ResetPasswordFormData {
  secret_code: string;
  new_password: string;
}

export const useResetPasswordForm = () => {
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.post('/auth/reset-password', data);
      const msg = 'Пароль успешно изменён';
      setSuccessMessage(msg);
      success('Пароль изменён', msg);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка при сбросе пароля';
      setError(errorMessage);
      notifyError('Ошибка', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleResetPassword,
    isLoading,
    error,
    success: successMessage,
  };
};
