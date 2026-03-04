import { useSidebarMenuStore } from "../../model/sidebar-menu.store"
import { useCallback, useEffect } from "react";
import { MENU_DATA } from "../constants/sidebar-menu.const";
import { useLocation } from "react-router-dom";

export const useSidebarMenu = () => {
    const {
        menu,
        setMenu
    } = useSidebarMenuStore();
    const location = useLocation();

    const filterMenu = useCallback((currentPath: any) => {
        return MENU_DATA
        .map(category => ({
            ...category,
            menu: category.menu.map(item => ({
                ...item,
                active: item.path === currentPath
            }))
        }))
    }, [])

    useEffect(() => {
        const filteredMenu = filterMenu(location.pathname)
        setMenu(filteredMenu);
    }, [location])

    return {menu};
}
