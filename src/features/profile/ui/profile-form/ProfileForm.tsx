import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfileForm } from "../../lib/hooks/profile-form.hook"
import { Camera, Save, Key, Upload, User, Mail, Phone } from "lucide-react"
import { useState, useEffect, useRef } from "react"

const ProfileForm = () => {
  const {
    profileData,
    handleUpdateProfile,
    handleChangePassword,
    handleUploadAvatar,
    isLoading,
    isPasswordLoading,
    isAvatarLoading,
  } = useProfileForm();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordForm, setPasswordForm] = useState({
    secret_code: '',
    new_password: '',
    confirm_password: '',
  });

  const [profileForm, setProfileForm] = useState({
    first_name: profileData.first_name,
    last_name: profileData.last_name,
    email: profileData.email,
    phone: profileData.phone || '',
    avatar: profileData.avatar || '',
  });

  // Обновляем форму при изменении profileData
  useEffect(() => {
    setProfileForm({
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      email: profileData.email,
      phone: profileData.phone || '',
      avatar: profileData.avatar || '',
    });
  }, [profileData.first_name, profileData.last_name, profileData.email, profileData.phone, profileData.avatar]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateProfile(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleChangePassword(passwordForm);
    setPasswordForm({ secret_code: '', new_password: '', confirm_password: '' });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadAvatar(file);
    }
  };

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      {/* Аватар и основная информация */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-[120px]" />
        <CardContent className="relative flex flex-col items-center gap-4 pt-0 pb-6">
          <div className="relative group -mt-[80px]">
            <Avatar className="h-[120px] w-[120px] border-4 border-background shadow-xl">
              <AvatarImage src={profileData.avatar} />
              <AvatarFallback className="text-[32px] bg-primary/10">
                {profileData.first_name?.[0]}{profileData.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium"
            >
              <Camera size={18} />
              <span>Изменить</span>
            </button>
            {isAvatarLoading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {profileData.last_name} {profileData.first_name}
            </h2>
            <p className="text-sm text-muted-foreground">{profileData.email}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAvatarClick}
            className="gap-2"
          >
            <Upload size={14} />
            Загрузить фото
          </Button>
        </CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </Card>

      {/* Личная информация и Безопасность */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Личная информация */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Личная информация</CardTitle>
                <CardDescription>Измените ваши персональные данные</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="text-sm font-medium text-muted-foreground">
                      Имя
                    </label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      placeholder="Введите имя"
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">Введите ваше имя</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last_name" className="text-sm font-medium text-muted-foreground">
                      Фамилия
                    </label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      placeholder="Введите фамилию"
                      className="h-9"
                    />
                    <p className="text-xs text-muted-foreground">Введите вашу фамилию</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail size={14} />
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="example@mail.ru"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">Введите адрес электронной почты</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone size={14} />
                    Телефон
                  </label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+7 (___) ___-__-__"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">Введите номер телефона</p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit" size="sm" disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Сохранить изменения
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Безопасность */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Key size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Безопасность</CardTitle>
                <CardDescription>Изменение пароля для входа</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="secret_code" className="text-sm font-medium text-muted-foreground">
                    Секретный код
                  </label>
                  <Input
                    id="secret_code"
                    type="text"
                    value={passwordForm.secret_code}
                    onChange={(e) => setPasswordForm({ ...passwordForm, secret_code: e.target.value })}
                    placeholder="••••••"
                    className="h-9"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">Введите ваш секретный код из базы данных</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="new_password" className="text-sm font-medium text-muted-foreground">
                      Новый пароль
                    </label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      placeholder="••••••••"
                      className="h-9"
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">Минимум 8 символов</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm_password" className="text-sm font-medium text-muted-foreground">
                      Подтверждение пароля
                    </label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      placeholder="••••••••"
                      className="h-9"
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">Повторите новый пароль</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit" size="sm" disabled={isPasswordLoading} className="gap-2">
                  {isPasswordLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Изменение...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Изменить пароль
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileForm;
