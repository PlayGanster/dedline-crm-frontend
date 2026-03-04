import { useNavigate } from "react-router-dom"
import { useSidebarToggleStore } from "../../model/sidebar-toggle.store";

export const useSidebarLogo = () => {
    const {
        setOpen
    } = useSidebarToggleStore();
    const navigate = useNavigate();

    const handleClickLogo = () => {
        navigate("/")
        if(window.innerWidth < 1024) {
            localStorage.setItem("open_sidebar", "close");
            setOpen(false);
        }
    }

    return {
        handleClickLogo
    }
}
