import { isMobile } from "react-device-detect";
import { useSidebarOverlay } from "../../lib/hooks/sidebar-overlay.hook"

const SidebarOverlay = () => {
    const {
        isOpen,
        handleClickOverlay
    } = useSidebarOverlay();

    return (
        <div
            className={`
                fixed
                w-dvw
                h-dvh
                z-200
                bg-background
                opacity-[0.7]
                cursor-pointer
                ${
                    isOpen && isMobile ? "" : "hidden"
                }
            `}
            onClick={handleClickOverlay}
        ></div>
    )
}

export default SidebarOverlay
