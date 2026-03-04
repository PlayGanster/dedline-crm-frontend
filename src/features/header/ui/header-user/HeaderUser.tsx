import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/entities/user"
import { CgProfile } from "react-icons/cg"
import { CiLogout } from "react-icons/ci"
import { IoSettingsSharp } from "react-icons/io5"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/features/auth"
import { useNotification } from "@/features/notification"

const HeaderUser = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const { success } = useNotification();

    const handleLogout = () => {
        logout();
        success('Выход выполнен', 'До скорой встречи!');
        navigate('/login');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <UserAvatar />
            </DropdownMenuTrigger>
            <DropdownMenuContent
            align="end"
            className="
                min-w-45
            "
            >
                <DropdownMenuGroup>
                    <DropdownMenuLabel >Аккаунт</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="
                            cursor-pointer
                            gap-3
                        "
                        onClick={() => navigate("/profile")}
                    >
                        <CgProfile size={16} />
                        Профиль
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="
                            cursor-pointer
                            gap-3
                        "
                        onClick={() => navigate("/settings")}
                    >
                        <IoSettingsSharp size={16} />
                        Настройки
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="
                            gap-3
                            cursor-pointer
                        "
                        onClick={handleLogout}
                    >
                        <CiLogout size={16} />
                        Выйти
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default HeaderUser
