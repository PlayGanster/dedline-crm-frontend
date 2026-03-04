import { ProfileForm } from "@/features/profile"
import { PageHeader } from "@/features/page-header"

const ProfilePage = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Профиль" />
      <div className="flex-1 overflow-auto p-[12px]">
        <ProfileForm />
      </div>
    </div>
  )
}

export default ProfilePage
