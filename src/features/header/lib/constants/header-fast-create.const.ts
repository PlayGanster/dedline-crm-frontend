import { FaPeopleCarryBox, FaUsers, FaFileContract } from "react-icons/fa6";
import { IoPeopleSharp, IoCallSharp } from "react-icons/io5";
import { MdPeople, MdAttachMoney } from "react-icons/md";
import { TbFileInvoice } from "react-icons/tb";
import type { FastCreateItem } from "../types/header-fast-create.const";

export const FastCreateItems: FastCreateItem[] = [
    {
        id: 1,
        name: "Клиент",
        icon: MdPeople,
        href: "/clients/create"
    },
    {
        id: 2,
        name: "Исполнитель",
        icon: FaPeopleCarryBox,
        href: "/performers/create"
    },
    {
        id: 3,
        name: "Заявка",
        icon: FaFileContract,
        href: "/applications/create"
    },
    {
        id: 4,
        name: "Входящий звонок",
        icon: IoCallSharp,
        href: "/incoming-calls/create"
    },
    {
        id: 5,
        name: "Транзакция",
        icon: MdAttachMoney,
        href: "/transactions/create"
    },
    {
        id: 6,
        name: "Счёт",
        icon: TbFileInvoice,
        href: "/invoices/create"
    },
    {
        id: 7,
        name: "Акт",
        icon: FaFileContract,
        href: "/acts/create"
    },
    {
        id: 8,
        name: "Пользователь",
        icon: FaUsers,
        href: "/users/create"
    }
]
