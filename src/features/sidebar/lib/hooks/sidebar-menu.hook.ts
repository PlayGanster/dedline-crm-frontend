import { useSidebarMenuStore } from "../../model/sidebar-menu.store"
import { useCallback, useEffect } from "react";
import { MENU_DATA } from "../constants/sidebar-menu.const";
import { useLocation } from "react-router-dom";
import { api } from "@/shared/api/api.client";
import { useRealtime } from "@/shared/providers/realtime";

export const useSidebarMenu = () => {
    const {
        menu,
        setMenu,
        updateItemUnreadCount
    } = useSidebarMenuStore();
    const location = useLocation();
    
    // Use realtime with fallback - it's always available in our app structure
    const { on, off } = useRealtime();

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

    // Fetch total unread chat count
    const fetchTotalUnreadCount = useCallback(async () => {
        try {
            const data: { count: number } = await api.get('/chat/unread/count');
            // data is { count: number }
            const total = data.count || 0;
            updateItemUnreadCount('/chats', total);
        } catch (err) {
            // Silently fail - unread count is not critical
            console.error('[Sidebar] Error fetching unread count:', err);
        }
    }, [updateItemUnreadCount]);

    // Handle new message event
    const handleNewMessage = useCallback((data: any) => {
        console.log('[Sidebar] Received new-message:', data);
        // Refetch unread count when new message arrives
        fetchTotalUnreadCount();
    }, [fetchTotalUnreadCount]);

    // Handle read event - update sidebar when messages are marked as read
    const handleRead = useCallback(() => {
        console.log('[Sidebar] Messages marked as read');
        fetchTotalUnreadCount();
    }, [fetchTotalUnreadCount]);

    // Listen for read-messages event (when current user reads messages)
    const handleReadMessages = useCallback(() => {
        console.log('[Sidebar] Current user read messages, updating counter');
        fetchTotalUnreadCount();
    }, [fetchTotalUnreadCount]);

    useEffect(() => {
        const filteredMenu = filterMenu(location.pathname)
        setMenu(filteredMenu);
        fetchTotalUnreadCount();
    }, [location, filterMenu, setMenu, fetchTotalUnreadCount]);

    useEffect(() => {
        if (!on || !off) return;
        on('new-message', handleNewMessage);
        on('read', handleRead);
        on('read-messages', handleReadMessages);
        return () => {
            off('new-message', handleNewMessage);
            off('read', handleRead);
            off('read-messages', handleReadMessages);
        };
    }, [on, off, handleNewMessage, handleRead, handleReadMessages]);

    return {menu};
}
