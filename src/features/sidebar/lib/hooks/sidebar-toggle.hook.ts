import { useEffect } from "react";
import { useSidebarToggleStore } from "../../model/sidebar-toggle.store"

export const useSidebarToggle = () => {
    const {
        isOpen,
        setOpen,
        setIsAnimated
    } = useSidebarToggleStore();

    useEffect(() => {
        if(window.innerWidth <= 1024) setOpen(false);
    }, [])

    useEffect(() => {
        const localOpen = localStorage.getItem("open_sidebar");
        if(window.innerWidth > 1024) {
            const shouldOpen = localOpen === "open" || localOpen === null;
            setOpen(shouldOpen);
        }else {
            setOpen(false);
        }
    }, [setOpen])

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnimated(true);
        }, 50);

        return () => clearTimeout(timer);
    }, [setIsAnimated])

    const toggleSidebar = (value: boolean) => {
        localStorage.setItem("open_sidebar", value ? "open" : "close");
        setOpen(value);
    }

    return {
        isOpen,
        toggleSidebar
    }
}
