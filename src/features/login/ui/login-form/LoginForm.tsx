import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { CiLogin } from "react-icons/ci"
import { MdLockReset } from "react-icons/md"
import { useNavigate } from "react-router-dom"
import { useLoginForm } from "../../lib/hooks/login-form.hook"

const LoginForm = () => {
  const navigate = useNavigate();
  const { handleSubmit, isLoading, error } = useLoginForm();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleSubmit({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };

  return (
    <form
      className="
        max-w-100
        w-full
      "
      onSubmit={onSubmit}
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
            <FieldGroup
              className="
                gap-3
              "
            >
              <Field
                className="gap-1"
              >
                <FieldLabel htmlFor="email">Эл. почта</FieldLabel>
                <Input
                  className="
                    w-full
                  "
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Почта"
                  required
                />
                <FieldDescription
                  className="
                    text-[12px]
                  "
                >
                  Введите свою почту
                </FieldDescription>
              </Field>
              <Field
                className="
                  gap-1
                "
              >
                <FieldLabel htmlFor="password">Пароль</FieldLabel>
                <Input
                  className="
                    w-full"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
                <FieldDescription
                  className="
                    text-[12px]
                  "
                >
                  Минимум 8 символов
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
        <CardFooter
          className="
            flex-col
            gap-3
            border-t
            border-border
          "
        >
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <Button
            variant="default"
            className="
              cursor-pointer
              w-full
            "
            size="sm"
            type="submit"
            disabled={isLoading}
          >
            <CiLogin size={16} /> {isLoading ? 'Вход...' : 'Войти'}
          </Button>
          <Button
            variant="outline"
            className="
              cursor-pointer
              bg-border
              border-border
              hover:bg-hover
              w-full
            "
            size="sm"
            type="button"
            onClick={() => navigate("/reset-password")}
          >
            <MdLockReset size={16} /> Сбросить пароль
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

export default LoginForm
