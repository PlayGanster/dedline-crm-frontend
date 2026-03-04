import type { PageHeaderType } from "../../lib/types/page-header.types"
import PageHeaderError from "../page-header-error/PageHeaderError"
import { PageHeaderProvider } from "../../lib/context/PageHeaderContext"

const PageHeader: React.FC<PageHeaderType> = ({
    name,
    children
}) => {
    return (
        <PageHeaderProvider pageName={name}>
            <div
                className="
                    border-b-2
                    border-border
                    bg-background
                    p-3
                    h-15
                    gap-3
                    flex
                    items-center
                    justify-between
                "
            >
                <p
                    className="
                        text-[18px]
                        font-semibold
                    "
                >
                    {name}
                </p>
                <div className="flex items-center gap-2">
                    {children}
                    <PageHeaderError />
                </div>
            </div>
        </PageHeaderProvider>
    )
}

export default PageHeader
