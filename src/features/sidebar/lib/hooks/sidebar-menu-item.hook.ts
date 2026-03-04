import { useNavigate } from "react-router-dom"
import { useSidebarToggleStore } from "../../model/sidebar-toggle.store";

export const useSidebarMenuItem = () => {
    const {
        setOpen
    } = useSidebarToggleStore();
    const navigate = useNavigate();

    const handleItemClick = (path: string) => {
        navigate(path)
        if(window.innerWidth < 1024) {
            localStorage.setItem("open_sidebar", "close");
            setOpen(false);
        }
    }

    return {handleItemClick}
}
