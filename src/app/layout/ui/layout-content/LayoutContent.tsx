import { Header } from "@/widgets/header";
import type { DefaultLayoutContentProps } from "../../lib/types/layout.types";

const LayoutContent: React.FC<DefaultLayoutContentProps> = ({
    children
}) => {
    return (
        <div className="flex flex-col min-w-0 w-full">
            <div className="w-full transition-all duration-400 ease-in-out">
                <Header />
                <div className="w-full h-[calc(100svh-60px)] overflow-y-auto overflow-x-hidden relative">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default LayoutContent
