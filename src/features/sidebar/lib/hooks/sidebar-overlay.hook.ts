import { useSidebarToggleStore } from "../../model/sidebar-toggle.store"

export const useSidebarOverlay = () => {
    const {
        isOpen,
        setOpen
    } = useSidebarToggleStore();

    const handleClickOverlay = () => {
        localStorage.setItem("open_sidebar", "close");
        setOpen(false)
    }

    return {
        isOpen,
        handleClickOverlay
    }
}
