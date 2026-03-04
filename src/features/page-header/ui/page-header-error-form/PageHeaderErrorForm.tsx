import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { IoSend } from "react-icons/io5"
import { useState, useRef } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useAuthStore } from "@/features/auth"
import { useUserStore } from "@/entities/user"

interface PageHeaderErrorFormProps {
  pageName: string;
  onSuccess: () => void;
}

const PageHeaderErrorForm = ({ pageName, onSuccess }: PageHeaderErrorFormProps) => {
  const { user: authUser } = useAuthStore();
  const { user: userData } = useUserStore();
  const { success, error: notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const user = userData || authUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Получаем данные о странице и пользователе
      const errorData: any = {
        description,
        page: pageName,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        screenshot: screenshot ? await fileToBase64(screenshot) : undefined,
      };

      // Добавляем данные пользователя если есть
      if (user) {
        errorData.user = {
          id: user.id,
          email: user.email,
          name: `${user.last_name} ${user.first_name}`,
        };
      } else {
        errorData.user = {
          id: 0,
          email: 'Не авторизован',
          name: 'Не авторизован',
        };
      }

      console.log('[ErrorReport] Sending data:', errorData);

      await api.post('/error-report', errorData);

      success('Отправлено', 'Спасибо за сообщение об ошибке!');
      setDescription('');
      setScreenshot(null);
      setPreviewUrl(null);
      onSuccess(); // Закрываем диалог
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось отправить сообщение');
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setScreenshot(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          break;
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setPreviewUrl(null);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <FieldSet className="w-full">
        <FieldGroup className="gap-3">
          <Field className="gap-1">
            <FieldLabel htmlFor="description">Описание</FieldLabel>
            <Textarea
              id="description"
              placeholder="Опишите ошибку... (можно вставить скриншот через Ctrl+V)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onPaste={handlePaste}
              ref={textareaRef}
              required
            />
          </Field>
          <Field className="gap-1">
            <FieldLabel htmlFor="screenshot">Фотография</FieldLabel>
            {previewUrl ? (
              <div className="relative inline-block">
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="max-h-40 rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <Input
                className="cursor-pointer"
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            )}
            <FieldDescription>Прикрепите скриншот ошибки (или нажмите Ctrl+V)</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
      <Button
        variant="default"
        className="cursor-pointer w-full mt-3"
        size="sm"
        type="submit"
        disabled={isLoading || !description}
      >
        <IoSend size={16} /> {isLoading ? 'Отправка...' : 'Отправить'}
      </Button>
    </form>
  );
};

export default PageHeaderErrorForm;
