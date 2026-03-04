import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useHeaderFastCreate } from "../../lib/hooks/header-fast-create.hook"
import { TbPlus } from "react-icons/tb"
import { useState } from "react"

const HeaderFastCreate = () => {
    const { handleClickItem, items } = useHeaderFastCreate();
    const [open, setOpen] = useState(false);

    console.log('[HeaderFastCreate] items:', items)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon-sm"
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => setOpen(true)}
                >
                    <TbPlus size={16} />
                </Button>
            </DialogTrigger>
            <DialogPortal>
                <DialogOverlay />
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Быстрое создание</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 pt-3">
                        {items.map((el, index) => (
                            <Button
                                size="sm"
                                variant="default"
                                key={index}
                                onClick={() => {
                                    handleClickItem(el.href)
                                    setOpen(false)
                                }}
                                className="cursor-pointer justify-start"
                            >
                                <el.icon size={18} /> {el.name}
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    )
}

export default HeaderFastCreate
