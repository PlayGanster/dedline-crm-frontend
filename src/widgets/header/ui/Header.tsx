import { HeaderFastCreate, HeaderSearch, HeaderUser } from "@/features/header"

const HeaderWidget = () => {
    return (
        <div
            className="
                w-full
                h-15
                border-b-2
                border-border
                p-3
                flex
                items-center
                justify-between
                bg-background
            "
        >
            <div
                className="
                    flex
                    gap-3
                    items-center
                    ml-12
                "
            >
                <HeaderSearch />
                <HeaderFastCreate />
            </div>
            <div
                className="
                    flex
                    gap-3
                    items-center
                "
            >
                <HeaderUser />
            </div>
        </div>
    )
}

export default HeaderWidget
