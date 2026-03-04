import { useSidebarLogo } from "../../lib/hooks/sidebar-logo.hook"
import Logo from "@assets/logo.png";
import LogoLight from "@assets/logo-light.png";
import { useTheme } from "@/app/providers/theme/ThemeProvider"

const SidebarLogo = () => {
    const { handleClickLogo } = useSidebarLogo();
    const { theme } = useTheme();

    const currentLogo = theme === 'light' ? LogoLight : Logo;

    return (
        <div
            className="
                w-full
                text-[20px]
                font-black
                cursor-pointer
                relative
                overflow-hidden
                bg-background
            "
            onClick={handleClickLogo}
        >
            <div
                className="
                    px-7
                    flex
                    items-center
                    max-h-15
                    h-15
                    border-b-2
                    border-border
                "
            >
                <img src={currentLogo} className="w-full" />
            </div>
        </div>
    )
}

export default SidebarLogo
