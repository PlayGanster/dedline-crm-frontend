import { Button } from "@/components/ui/button";
import { useSidebarToggle } from "../../lib/hooks/sidebar-toggle.hook"
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SidebarToggle = () => {
    const {
        isOpen,
        toggleSidebar
    } = useSidebarToggle();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="default"
                    size="icon-sm"
                    onClick={() => toggleSidebar(!isOpen)}
                    className="
                        absolute
                        -right-12
                        top-3.25
                        cursor-pointer
                    "
                >
                    {
                        isOpen ? (
                            <IoIosArrowBack size={18} />
                        ) : (
                            <IoIosArrowForward size={18} />
                        )
                    }
                </Button>
            </TooltipTrigger>
            <TooltipContent align="start">
                {
                    isOpen ? "Закрыть меню" : "Открыть меню"
                }
            </TooltipContent>
        </Tooltip>
    )
}

export default SidebarToggle
