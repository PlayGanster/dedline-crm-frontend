import type { IconType } from "react-icons";

export interface MenuSidebarItem {
    name: string;
    active: boolean;
    icon: IconType;
    path: string;
    unreadCount?: number;
}

export interface MenuCategorySidebar {
    menu: MenuSidebarItem[];
    category_name: string;
}
