import { LoginForm } from "@/features/login"

const LoginPage = () => {
  return (
    <div className="w-dwh h-dvh flex-col gap-5 flex justify-center items-center p-3">
      <p className="text-[24px] font-semibold">Авторизация</p>
      <LoginForm />
    </div>
  )
}

export default LoginPage
