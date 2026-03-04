import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/model/auth.store';
import { Layout } from '@/app/layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  haveLayout?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  haveLayout = true
}) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Проверка токена из localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const isAuth = isAuthenticated || !!token;

  if (!isAuth) {
    // Не редиректим, если уже на странице логина или сброса пароля
    if (location.pathname === '/login' || location.pathname === '/reset-password') {
      return <>{children}</>;
    }

    // Сохраняем текущий URL для возврата после логина
    // Избегаем дублирования redirect параметра
    const existingRedirect = location.search.match(/redirect=([^&]+)/);
    const redirectUrl = existingRedirect
      ? existingRedirect[1]
      : encodeURIComponent(location.pathname + location.search);

    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  // Если авторизован и на странице логина/сброса пароля - редирект на главную
  if (isAuth && (location.pathname === '/login' || location.pathname === '/reset-password')) {
    return <Navigate to="/" replace />;
  }

  if (haveLayout) {
    return <Layout>{children}</Layout>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
