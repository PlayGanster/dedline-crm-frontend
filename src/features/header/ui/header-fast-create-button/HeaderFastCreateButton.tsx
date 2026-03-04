import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TbPlus } from "react-icons/tb"

const HeaderFastCreateButton = () => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    size="icon-sm"
                    variant="default"
                    className="cursor-pointer"
                >
                    <TbPlus size={16} />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                Быстрое создание
            </TooltipContent>
        </Tooltip>
    )
}

export default HeaderFastCreateButton
