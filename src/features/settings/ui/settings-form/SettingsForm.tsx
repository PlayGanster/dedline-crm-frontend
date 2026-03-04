import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Save, Clock, Moon, Sun, Monitor, Check, FileText, ArrowRight } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useNotification } from "@/features/notification"
import { useAuthStore } from "@/features/auth"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/app/providers/theme/ThemeProvider"

interface SettingsData {
  autoLogoutTime: string;
}

const SettingsForm = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { success } = useNotification();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<SettingsData>({
    autoLogoutTime: localStorage.getItem('auto_logout_time') || '30',
  });

  const [autoLogoutTimer, setAutoLogoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);

  // Функция выхода
  const performAutoLogout = useCallback(() => {
    console.log('[AutoLogout] Performing logout due to inactivity');
    logout();
    success('Автовыход', 'Вы автоматически вышли из системы из-за неактивности');
    navigate('/login');
  }, [logout, success, navigate]);

  // Проверка бездействия
  const checkInactivity = useCallback(() => {
    const timeInMinutes = parseInt(settings.autoLogoutTime);
    if (timeInMinutes <= 0) return;

    const now = Date.now();
    const elapsed = now - lastActivity;
    const timeout = timeInMinutes * 60 * 1000;

    if (elapsed >= timeout) {
      performAutoLogout();
    }
  }, [settings.autoLogoutTime, lastActivity, performAutoLogout]);

  // Сброс таймера активности
  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Инициализация автовыхода
  useEffect(() => {
    const timeInMinutes = parseInt(settings.autoLogoutTime);

    // Если автовыход отключен
    if (timeInMinutes <= 0) {
      if (autoLogoutTimer) {
        clearInterval(autoLogoutTimer as unknown as NodeJS.Timeout);
      }
      return;
    }

    // Проверяем каждые 10 секунд
    const interval = setInterval(checkInactivity, 10000);
    setAutoLogoutTimer(interval as unknown as NodeJS.Timeout);

    // Слушатели активности пользователя
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetActivity);
    });

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetActivity);
      });
    };
  }, [settings.autoLogoutTime, checkInactivity, resetActivity]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Сохраняем настройки в localStorage
    localStorage.setItem('auto_logout_time', settings.autoLogoutTime);

    // Сбрасываем активность при сохранении
    resetActivity();

    setTimeout(() => {
      success('Настройки сохранены', 'Изменения применены');
      setIsSaving(false);
    }, 300);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const themeOptions = [
    { value: 'light' as const, label: 'Светлая', icon: Sun, description: 'Классический светлый интерфейс' },
    { value: 'dark' as const, label: 'Тёмная', icon: Moon, description: 'Стильный тёмный интерфейс' },
    { value: 'system' as const, label: 'Системная', icon: Monitor, description: 'Как в системе' },
  ] as const;

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      {/* Тема оформления */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10">
              {theme === 'dark' ? <Moon size={24} className="text-primary" /> : theme === 'light' ? <Sun size={24} className="text-primary" /> : <Monitor size={24} className="text-primary" />}
            </div>
            <div>
              <CardTitle className="text-xl">Тема оформления</CardTitle>
              <CardDescription>Выберите подходящую тему для комфортной работы</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                  className={`
                    relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200
                    ${isActive 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 text-primary">
                      <Check size={18} strokeWidth={3} />
                    </div>
                  )}
                  <div className={`
                    p-3 rounded-full
                    ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                  `}>
                    <Icon size={24} />
                  </div>
                  <div className="text-center">
                    <p className={`font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Автоматический выход */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Clock size={24} className="text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Автоматический выход</CardTitle>
              <CardDescription>Настройте время бездействия для безопасности</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                <label htmlFor="autoLogoutTime" className="text-sm font-medium text-muted-foreground mb-2 block">
                  Время бездействия (минут)
                </label>
                <Input
                  id="autoLogoutTime"
                  type="number"
                  min="0"
                  max="120"
                  value={settings.autoLogoutTime}
                  onChange={(e) => setSettings({ ...settings, autoLogoutTime: e.target.value })}
                  placeholder="30"
                  className="h-9 max-w-[200px]"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="h-9 px-6"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save size={14} className="mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {settings.autoLogoutTime === '0' 
                  ? 'Автовыход отключён — вы будете оставаться в системе пока не выйдете вручную' 
                  : `Автоматический выход через ${settings.autoLogoutTime} мин бездействия`}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Логи приложения */}
      <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => navigate('/logs-app')}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10">
              <FileText size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Логи приложения</CardTitle>
              <CardDescription>Просмотр системных событий и ошибок</CardDescription>
            </div>
            <ArrowRight size={20} className="text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Журнал событий приложения, ошибки, предупреждения и системные уведомления
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsForm;
