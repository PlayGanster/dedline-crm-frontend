// widgets/sidebar/model/sidebar.constants.ts
import {
  MdAutoGraph, MdCall, MdPeople, MdSettings
} from "react-icons/md";
import { RiUserFill } from "react-icons/ri";
import { FaFileContract, FaFileInvoiceDollar, FaPeopleCarryBox, FaUsers } from "react-icons/fa6";
import { TbTransactionDollar } from "react-icons/tb";
import { LuBadgeDollarSign, LuLogs, LuUser } from "react-icons/lu";
import { GiExpense } from "react-icons/gi";
import { IoIosNotifications } from "react-icons/io";
import { BiChat } from "react-icons/bi";
import { GrDocumentText } from "react-icons/gr";
import type { MenuCategorySidebar } from "../types/sidebar-menu.types";

export const MENU_DATA: MenuCategorySidebar[] = [
  {
    menu: [
      {
        name: "Дашбоард",
        active: false,
        icon: MdAutoGraph,
        path: "/",
      },
      {
        name: "Клиенты",
        active: false,
        icon: MdPeople,
        path: "/clients",
      },
      {
        name: "Исполнители",
        active: false,
        icon: FaPeopleCarryBox,
        path: "/performers",
      },
      {
        name: "Заявки",
        active: false,
        icon: FaFileContract,
        path: "/applications",
      },
      {
        name: "Входящие",
        active: false,
        icon: MdCall,
        path: "/incoming-calls",
      },
    ],
    category_name: "Основные",
  },
  {
    menu: [
      {
        name: "Транзакции",
        active: false,
        icon: TbTransactionDollar,
        path: "/transactions",
      },
      {
        name: "Счета",
        active: false,
        icon: FaFileInvoiceDollar,
        path: "/invoices",
      },
      {
        name: "Акты",
        active: false,
        icon: FaFileContract,
        path: "/acts",
      },
      {
        name: "Доходы",
        active: false,
        icon: LuBadgeDollarSign,
        path: "/incomes",
      },
      {
        name: "Расходы",
        active: false,
        icon: GiExpense,
        path: "/expenses",
      },
    ],
    category_name: "Финансы",
  },
  {
    menu: [
      {
        name: "Уведомления",
        active: false,
        icon: IoIosNotifications,
        path: "/notifications",
      },
      {
        name: "Чаты",
        active: false,
        icon: BiChat,
        path: "/chats",
      },
    ],
    category_name: "Коммуникации",
  },
  {
    menu: [
      {
        name: "Пользователи",
        active: false,
        icon: FaUsers,
        path: "/users",
      },
      {
        name: "Логи CRM",
        active: false,
        icon: LuLogs,
        path: "/logs-crm",
      },
      {
        name: "Логи APP",
        active: false,
        icon: LuLogs,
        path: "/logs-app",
      },
      {
        name: "Настройки",
        active: false,
        icon: MdSettings,
        path: "/settings",
      },
      {
        name: "Профиль",
        active: false,
        icon: LuUser,
        path: "/profile",
      },
    ],
    category_name: "Администрирование",
  },
];
