import { SidebarOverlay, SidebarLogo, SidebarMenu, SidebarToggle, useSidebarToggleStore } from "@/features/sidebar"
import { isMobile } from "react-device-detect"

const SidebarWidget = () => {
    const { isOpen } = useSidebarToggleStore();

    const styleWidth = () => {
        if(isMobile) return "230px";
        else return isOpen ? "230px" : "0px";
    }

    const styleTransformation = () => {
        if(isMobile) return !isOpen ? "-230px" : "0px";
    }

    return (
        <>
            <SidebarOverlay />
            <div
                className="
                    h-dvh
                    lg:relative
                    fixed
                    top-0
                    z-1
                    border-r-2
                    border-border
                    bg-background
                    text-nowrap
                "
                style={{
                    width: styleWidth(),
                    transform: `translateX(${styleTransformation()})`
                }}
            >
                <SidebarToggle />
                <SidebarLogo />
                <SidebarMenu />
            </div>
        </>
    )
}

export default SidebarWidget
