import { ResetPasswordForm } from '@/features/reset-password'

const ResetPasswordPage = () => {
  return (
    <div className="w-dwh h-dvh flex-col gap-5 flex justify-center items-center p-3">
      <p className="text-[24px] font-semibold">Сбросить пароль</p>
      <ResetPasswordForm />
    </div>
  )
}

export default ResetPasswordPage
