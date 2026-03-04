import { useSidebarMenu } from "../../lib/hooks/sidebar-menu.hook"
import SidebarMenuItem from "../sidebar-menu-item/SidebarMenuItem";

const SidebarMenu = () => {
    const {menu} = useSidebarMenu();

    return (
        <div className="
            max-h-[calc(100dvh-100px)]
            overflow-y-auto
            overflow-x-hidden
        ">
            {
                menu && menu.map((el, index) => (
                    <div
                        key={index}
                        className="
                            w-full
                            p-[20px_16px]
                            border-b-2
                            border-border
                            pt-2
                            flex
                            flex-col
                        "
                    >
                        <p className="
                            text-[12px]
                            font-bold
                            p-[8px_7.5px]
                            text-foreground
                        ">
                            {el.category_name}
                        </p>
                        <div className="
                            flex
                            flex-col
                            gap-1.5
                        ">
                            {
                                el.menu.map((item, i) => (
                                    <SidebarMenuItem item={item} key={i} />
                                ))
                            }
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default SidebarMenu
