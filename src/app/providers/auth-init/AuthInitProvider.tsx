import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { useUserStore } from '@/entities/user/model/user.store';
import { api } from '@/shared/api/api.client';

interface AuthInitContextType {
  isInitializing: boolean;
}

const AuthInitContext = createContext<AuthInitContextType>({ isInitializing: true });

export function AuthInitProvider({ children }: { children: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const { setToken, setUser } = useAuthStore();
  const { setUser: setUserData } = useUserStore();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        console.log('[AuthInit] No token found');
        setIsInitializing(false);
        return;
      }

      console.log('[AuthInit] Token found, fetching user data...');

      try {
        const userData = await api.get<{
          id: number;
          email: string;
          first_name: string;
          last_name: string;
          role: string;
          avatar?: string;
          phone?: string;
          secret_code?: string;
          created_at: number | string;
          is_active: boolean | number;
        }>('/auth/me', { token });

        console.log('[AuthInit] User data received:', userData);

        setToken(token);
        setUser(userData);
        setUserData({
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: (userData.role || 'MANAGER').toLowerCase() as any,
          avatar: userData.avatar || '',
          phone: userData.phone || undefined,
          secret_code: userData.secret_code || undefined,
          created_at: typeof userData.created_at === 'string' ? Date.parse(userData.created_at) : (userData.created_at as number),
          is_active: userData.is_active ? 1 : 0,
        });

        console.log('[AuthInit] User store updated');
      } catch (error) {
        console.error('[AuthInit] Error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthInitContext.Provider value={{ isInitializing }}>
      {children}
    </AuthInitContext.Provider>
  );
}

export function useAuthInit() {
  return useContext(AuthInitContext);
}
