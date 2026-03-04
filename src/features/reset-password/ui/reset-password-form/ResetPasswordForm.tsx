import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { CiLogin } from "react-icons/ci"
import { MdLockReset } from "react-icons/md"
import { useNavigate } from "react-router-dom"
import { useResetPasswordForm } from "../../lib/hooks/reset-password-form.hook"

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const {
    handleResetPassword,
    isLoading,
    error,
    success,
  } = useResetPasswordForm();

  const handleResetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleResetPassword({
      secret_code: formData.get('secret_code') as string,
      new_password: formData.get('new_password') as string,
    });
  };

  return (
    <form
      className="
        max-w-100
        w-full
      "
      onSubmit={handleResetSubmit}
    >
      <Card
        className="
          max-w-100
          w-full
          gap-3
        "
      >
        <CardContent>
          <FieldSet className="w-full">
            <FieldGroup className="gap-3">
              <Field className="gap-1">
                <FieldLabel htmlFor="secret_code">Секретный код</FieldLabel>
                <Input
                  className="w-full"
                  id="secret_code"
                  name="secret_code"
                  type="text"
                  placeholder="••••••"
                  required
                  minLength={6}
                  maxLength={6}
                />
                <FieldDescription className="text-[12px]">
                  Введите ваш секретный код из базы данных
                </FieldDescription>
              </Field>
              <Field className="gap-1">
                <FieldLabel htmlFor="new_password">Новый пароль</FieldLabel>
                <Input
                  className="w-full"
                  id="new_password"
                  name="new_password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <FieldDescription className="text-[12px]">
                  Минимум 8 символов
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
        <CardFooter className="flex-col gap-3 border-t border-border">
          {error && <p className="text-destructive text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
          <Button
            variant="default"
            className="cursor-pointer w-full"
            size="sm"
            type="submit"
            disabled={isLoading}
          >
            <MdLockReset size={16} /> {isLoading ? 'Сброс...' : 'Сбросить пароль'}
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer bg-border border-border hover:bg-hover w-full"
            size="sm"
            type="button"
            onClick={() => navigate("/login")}
          >
            <CiLogin size={16} /> Войти
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default ResetPasswordForm
