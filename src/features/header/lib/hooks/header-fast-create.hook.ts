import { useNavigate } from "react-router-dom"
import { FastCreateItems } from "../constants/header-fast-create.const";

export const useHeaderFastCreate = () => {
    const items = FastCreateItems;
    const navigate = useNavigate();

    const handleClickItem = (path: string) => {
        navigate(path)
    }

    return {
        handleClickItem,
        items
    }
}
