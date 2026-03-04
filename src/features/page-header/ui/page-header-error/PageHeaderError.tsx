import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MdOutlineErrorOutline } from "react-icons/md"
import PageHeaderErrorForm from "../page-header-error-form/PageHeaderErrorForm"
import { useState } from "react"
import { usePageHeader } from "@/features/page-header/lib/context/PageHeaderContext"

const PageHeaderError = () => {
    const [open, setOpen] = useState(false);
    const { pageName } = usePageHeader();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setOpen(true)}
                >
                    <MdOutlineErrorOutline size={16} /> Нашли ошибку?
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Нашли ошибку?</DialogTitle>
                    <DialogDescription>
                        Если вы нашли ошибку на странице, то отправьте нам описание ошибки. Название страницы и ссылка отправяться сами.
                    </DialogDescription>
                </DialogHeader>
                <PageHeaderErrorForm pageName={pageName} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}

export default PageHeaderError
