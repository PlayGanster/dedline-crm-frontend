import { useSidebarMenuItem } from "../../lib/hooks/sidebar-menu-item.hook";
import type { SidebarItemProps } from "../../lib/types/sidebar-menu-item.types"

const SidebarMenuItem: React.FC<SidebarItemProps> = ({
    item
}) => {
    const {handleItemClick} = useSidebarMenuItem()
    const Icon = item.icon;

    return (
        <div
            className={`
                text-[14px]
                font-semibold
                p-[8px_7.5px]
                h-8.75
                w-full
                rounded-md
                flex
                gap-3
                items-center
                cursor-pointer
                group
                transition-colors
                duration-200
                ${item.active ?
                    'bg-primary text-primary-foreground shadow-md' :
                    'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }
            `}
            onClick={() => handleItemClick(item.path)}
        >
            <Icon
                size={20}
                className="min-w-5"
            />
            {item.name}
        </div>
    )
}

export default SidebarMenuItem
