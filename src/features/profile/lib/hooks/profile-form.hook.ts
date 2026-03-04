import { useState } from 'react';
import { useAuthStore } from '@/features/auth';
import { useUserStore } from '@/entities/user';
import { useNotification } from '@/features/notification';
import { api } from '@/shared/api/api.client';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface PasswordFormData {
  secret_code: string;
  new_password: string;
  confirm_password: string;
}

export const useProfileForm = () => {
  const { user: authUser } = useAuthStore();
  const { user: userData, setUser } = useUserStore();
  const { success, error: notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);

  // Берём данные из user store, если нет - из auth store
  const user = userData || authUser;

  const profileData = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
    avatar: user?.avatar || '',
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!user) {
      notifyError('Ошибка', 'Пользователь не авторизован');
      return;
    }

    setIsLoading(true);

    try {
      // Сохраняем текущий аватар, если он есть
      const updateData = {
        ...data,
        avatar: data.avatar || user.avatar || undefined,
      };

      console.log('[Profile] Sending update:', updateData);

      const response = await api.put('/users/profile', updateData);

      console.log('[Profile] Backend response:', response);

      setUser({
        ...user,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || '',
        avatar: updateData.avatar || '',
        role: user.role,
        created_at: (user as any).created_at || Date.now(),
        is_active: (user as any).is_active ?? 1,
      } as any);

      success('Профиль обновлён', 'Изменения успешно сохранены');
    } catch (err: any) {
      console.error('[Profile] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось обновить профиль');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    if (!user) {
      notifyError('Ошибка', 'Пользователь не авторизован');
      return;
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      notifyError('Ошибка', 'Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notifyError('Ошибка', 'Размер файла не должен превышать 5MB');
      return;
    }

    setIsAvatarLoading(true);

    try {
      // Отправляем файл через FormData
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('[Avatar] Uploading file:', file.name, file.type, file.size);

      // Не устанавливаем Content-Type вручную - браузер сам добавит boundary
      const response = await api.put('/users/profile/avatar', formData);

      console.log('[Avatar] Upload response:', response);

      const avatarUrl = response.avatar;
      console.log('[Avatar] Avatar URL:', avatarUrl);

      setUser({
        ...user,
        avatar: avatarUrl,
        role: user.role,
        created_at: (user as any).created_at || Date.now(),
        is_active: (user as any).is_active ?? 1,
      } as any);

      success('Аватар обновлён', 'Фото профиля успешно загружено');
    } catch (err: any) {
      console.error('[Avatar] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить аватар');
    } finally {
      setIsAvatarLoading(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    if (!user) {
      notifyError('Ошибка', 'Пользователь не авторизован');
      return;
    }

    setIsPasswordLoading(true);

    if (data.new_password !== data.confirm_password) {
      notifyError('Ошибка', 'Пароли не совпадают');
      setIsPasswordLoading(false);
      return;
    }

    if (data.new_password.length < 8) {
      notifyError('Ошибка', 'Пароль должен быть не менее 8 символов');
      setIsPasswordLoading(false);
      return;
    }

    try {
      await api.post('/auth/change-password', {
        secret_code: data.secret_code,
        new_password: data.new_password,
      });

      success('Пароль изменён', 'Пароль успешно обновлён');
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось изменить пароль');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return {
    profileData,
    handleUpdateProfile,
    handleChangePassword,
    handleUploadAvatar,
    isLoading,
    isPasswordLoading,
    isAvatarLoading,
  };
};
