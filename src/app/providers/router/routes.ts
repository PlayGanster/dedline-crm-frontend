import { lazy } from "react";
import type { RouteType } from "./router.types";

// Auth pages (no layout)
const LazyLoginPage = lazy(() => import("@pages/login").then(module => ({ default: module.LoginPage })));
const LazyResetPasswordPage = lazy(() => import("@pages/reset-password").then(module => ({ default: module.ResetPasswordPage })));

// Main pages
const LazyHomePage = lazy(() => import("@pages/home").then(module => ({ default: module.HomePage })));
const LazyDashboardPage = lazy(() => import("@pages/dashboard").then(module => ({ default: module.DashboardPage })));
const LazyProfilePage = lazy(() => import("@pages/profile").then(module => ({ default: module.ProfilePage })));
const LazySettingsPage = lazy(() => import("@pages/settings").then(module => ({ default: module.SettingsPage })));
const LazyLogsCrmPage = lazy(() => import("@pages/logs-crm").then(module => ({ default: module.LogsCrmPage })));
const LazyUsersPage = lazy(() => import("@pages/users").then(module => ({ default: module.UsersPage })));
const LazyUserProfilePage = lazy(() => import("@pages/user-profile").then(module => ({ default: module.UserProfilePage })));
const LazyUserEditPage = lazy(() => import("@pages/user-edit").then(module => ({ default: module.UserEditPage })));
const LazyUserCreatePage = lazy(() => import("@pages/user-create").then(module => ({ default: module.UserCreatePage })));
const LazyAppLogsPage = lazy(() => import("@pages/app-logs").then(module => ({ default: module.AppLogsPage })));
const LazyClientsPage = lazy(() => import("@pages/clients").then(module => ({ default: module.ClientsPage })));
const LazyClientProfilePage = lazy(() => import("@pages/clients").then(module => ({ default: module.ClientProfilePage })));
const LazyClientCreatePage = lazy(() => import("@pages/clients").then(module => ({ default: module.ClientCreatePage })));
const LazyClientEditPage = lazy(() => import("@pages/clients").then(module => ({ default: module.ClientEditPage })));
const LazyPerformersPage = lazy(() => import("@pages/performers").then(module => ({ default: module.PerformersPage })));
const LazyPerformerProfilePage = lazy(() => import("@pages/performers").then(module => ({ default: module.PerformerProfilePage })));
const LazyPerformerCreatePage = lazy(() => import("@pages/performers").then(module => ({ default: module.PerformerCreatePage })));
const LazyPerformerEditPage = lazy(() => import("@pages/performers").then(module => ({ default: module.PerformerEditPage })));
const LazyApplicationsPage = lazy(() => import("@pages/applications").then(module => ({ default: module.ApplicationsPage })));
const LazyApplicationProfilePage = lazy(() => import("@pages/applications").then(module => ({ default: module.ApplicationProfilePage })));
const LazyApplicationCreatePage = lazy(() => import("@pages/applications").then(module => ({ default: module.ApplicationCreatePage })));
const LazyApplicationEditPage = lazy(() => import("@pages/applications").then(module => ({ default: module.ApplicationEditPage })));
const LazyIncomingCallsPage = lazy(() => import("@pages/incoming-calls").then(module => ({ default: module.IncomingCallsPage })));
const LazyConvertToClientPage = lazy(() => import("@pages/incoming-calls").then(module => ({ default: module.ConvertToClientPage })));
const LazyConvertToApplicationPage = lazy(() => import("@pages/incoming-calls").then(module => ({ default: module.ConvertToApplicationPage })));
const LazyConvertToClientAndApplicationPage = lazy(() => import("@pages/incoming-calls").then(module => ({ default: module.ConvertToClientAndApplicationPage })));
const LazyCreateIncomingCallPage = lazy(() => import("@pages/incoming-calls").then(module => ({ default: module.CreateIncomingCallPage })));
const LazyTransactionsPage = lazy(() => import("@pages/transactions").then(module => ({ default: module.TransactionsPage })));
const LazyTransactionProfilePage = lazy(() => import("@pages/transactions").then(module => ({ default: module.TransactionProfilePage })));
const LazyTransactionFormPage = lazy(() => import("@pages/transactions").then(module => ({ default: module.TransactionFormPage })));
const LazyInvoicesPage = lazy(() => import("@pages/invoices").then(module => ({ default: module.InvoicesPage })));
const LazyInvoiceProfilePage = lazy(() => import("@pages/invoices").then(module => ({ default: module.InvoiceProfilePage })));
const LazyInvoiceFormPage = lazy(() => import("@pages/invoices").then(module => ({ default: module.InvoiceFormPage })));
const LazyActsPage = lazy(() => import("@pages/acts").then(module => ({ default: module.ActsPage })));
const LazyActProfilePage = lazy(() => import("@pages/acts").then(module => ({ default: module.ActProfilePage })));
const LazyActFormPage = lazy(() => import("@pages/acts").then(module => ({ default: module.ActFormPage })));
const LazyIncomesPage = lazy(() => import("@pages/incomes").then(module => ({ default: module.IncomesPage })));
const LazyExpensesPage = lazy(() => import("@pages/expenses").then(module => ({ default: module.ExpensesPage })));
const LazyNotificationsPage = lazy(() => import("@pages/notifications").then(module => ({ default: module.NotificationsPage })));
const LazyChatsPage = lazy(() => import("@pages/chats").then(module => ({ default: module.ChatsPage })));
const LazyTransactionCreatePage = lazy(() => import("@pages/transactions").then(module => ({ default: module.TransactionCreatePage })));
const LazyInvoiceCreatePage = lazy(() => import("@pages/invoices").then(module => ({ default: module.InvoiceCreatePage })));
const LazyActCreatePage = lazy(() => import("@pages/acts").then(module => ({ default: module.ActCreatePage })));

export const routes: RouteType[] = [
    // Auth routes (no layout)
    {
        path: '/login',
        component: LazyLoginPage,
        haveLayout: false
    },
    {
        path: '/reset-password',
        component: LazyResetPasswordPage,
        haveLayout: false
    },

    // Main routes
    {
        path: '/',
        component: LazyDashboardPage,
        haveLayout: true
    },
    {
        path: '/home',
        component: LazyHomePage,
        haveLayout: true
    },
    {
        path: '/profile',
        component: LazyProfilePage,
        haveLayout: true
    },
    {
        path: '/settings',
        component: LazySettingsPage,
        haveLayout: true
    },
    {
        path: '/logs-crm',
        component: LazyLogsCrmPage,
        haveLayout: true
    },
    {
        path: '/users',
        component: LazyUsersPage,
        haveLayout: true
    },
    {
        path: '/users/:id',
        component: LazyUserProfilePage,
        haveLayout: true
    },
    {
        path: '/users/:id/edit',
        component: LazyUserEditPage,
        haveLayout: true
    },
    {
        path: '/users/create',
        component: LazyUserCreatePage,
        haveLayout: true
    },
    {
        path: '/logs-app',
        component: LazyAppLogsPage,
        haveLayout: true
    },
    {
        path: '/clients',
        component: LazyClientsPage,
        haveLayout: true
    },
    {
        path: '/clients/:id',
        component: LazyClientProfilePage,
        haveLayout: true
    },
    {
        path: '/clients/create',
        component: LazyClientCreatePage,
        haveLayout: true
    },
    {
        path: '/clients/:id/edit',
        component: LazyClientEditPage,
        haveLayout: true
    },
    {
        path: '/performers',
        component: LazyPerformersPage,
        haveLayout: true
    },
    {
        path: '/performers/:id',
        component: LazyPerformerProfilePage,
        haveLayout: true
    },
    {
        path: '/performers/create',
        component: LazyPerformerCreatePage,
        haveLayout: true
    },
    {
        path: '/performers/:id/edit',
        component: LazyPerformerEditPage,
        haveLayout: true
    },
    {
        path: '/applications',
        component: LazyApplicationsPage,
        haveLayout: true
    },
    {
        path: '/applications/:id',
        component: LazyApplicationProfilePage,
        haveLayout: true
    },
    {
        path: '/applications/create',
        component: LazyApplicationCreatePage,
        haveLayout: true
    },
    {
        path: '/applications/:id/edit',
        component: LazyApplicationEditPage,
        haveLayout: true
    },
    {
        path: '/incoming-calls',
        component: LazyIncomingCallsPage,
        haveLayout: true
    },
    {
        path: '/incoming-calls/:id/convert-to-client',
        component: LazyConvertToClientPage,
        haveLayout: true
    },
    {
        path: '/incoming-calls/:id/convert-to-application',
        component: LazyConvertToApplicationPage,
        haveLayout: true
    },
    {
        path: '/incoming-calls/:id/convert-to-client-and-application',
        component: LazyConvertToClientAndApplicationPage,
        haveLayout: true
    },
    {
        path: '/incoming-calls/create',
        component: LazyCreateIncomingCallPage,
        haveLayout: true
    },
    {
        path: '/transactions',
        component: LazyTransactionsPage,
        haveLayout: true
    },
    {
        path: '/transactions/:id',
        component: LazyTransactionProfilePage,
        haveLayout: true
    },
    {
        path: '/transactions/create',
        component: LazyTransactionFormPage,
        haveLayout: true
    },
    {
        path: '/transactions/:id/edit',
        component: LazyTransactionFormPage,
        haveLayout: true
    },
    {
        path: '/invoices',
        component: LazyInvoicesPage,
        haveLayout: true
    },
    {
        path: '/invoices/:id',
        component: LazyInvoiceProfilePage,
        haveLayout: true
    },
    {
        path: '/invoices/create',
        component: LazyInvoiceFormPage,
        haveLayout: true
    },
    {
        path: '/invoices/:id/edit',
        component: LazyInvoiceFormPage,
        haveLayout: true
    },
    {
        path: '/acts',
        component: LazyActsPage,
        haveLayout: true
    },
    {
        path: '/acts/:id',
        component: LazyActProfilePage,
        haveLayout: true
    },
    {
        path: '/acts/create',
        component: LazyActFormPage,
        haveLayout: true
    },
    {
        path: '/acts/:id/edit',
        component: LazyActFormPage,
        haveLayout: true
    },
    {
        path: '/incomes',
        component: LazyIncomesPage,
        haveLayout: true
    },
    {
        path: '/expenses',
        component: LazyExpensesPage,
        haveLayout: true
    },
    {
        path: '/notifications',
        component: LazyNotificationsPage,
        haveLayout: true
    },
    {
        path: '/chats',
        component: LazyChatsPage,
        haveLayout: true
    },
    {
        path: '/transactions/create',
        component: LazyTransactionCreatePage,
        haveLayout: true
    },
    {
        path: '/invoices/create',
        component: LazyInvoiceCreatePage,
        haveLayout: true
    },
    {
        path: '/acts/create',
        component: LazyActCreatePage,
        haveLayout: true
    }
]
