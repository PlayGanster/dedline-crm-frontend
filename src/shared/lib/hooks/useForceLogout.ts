import { useEffect, useRef } from 'react';
import { useRealtime } from '@/shared/providers/realtime';
import { useAuthStore } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '@/features/notification';

export const useForceLogout = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { error: notifyError } = useNotification();
  const { on, off, connected } = useRealtime();
  const handlerRef = useRef<((data: { reason: string }) => void) | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    console.log('[ForceLogout] Effect run, connected:', connected, 'subscribed:', subscribedRef.current);

    // Создаем обработчик только один раз
    if (!handlerRef.current) {
      handlerRef.current = (data: { reason: string }) => {
        console.log('[ForceLogout] Received event:', data);
        notifyError('Доступ запрещён', data.reason || 'Ваш аккаунт был удалён');
        logout();
        navigate('/login', { replace: true });
      };
    }

    const handler = handlerRef.current;

    // Подписываемся на событие принудительного выхода только один раз
    if (!subscribedRef.current && connected) {
      console.log('[ForceLogout] Subscribing to force-logout');
      on('force-logout', handler);
      subscribedRef.current = true;
    }

    return () => {
      // Не отписываемся при размонтировании, чтобы сохранить подписку
      console.log('[ForceLogout] Cleanup (not unsubscribing)');
    };
  }, [connected, on, logout, navigate, notifyError]);
};
