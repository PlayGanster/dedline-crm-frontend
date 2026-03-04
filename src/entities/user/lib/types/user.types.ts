export type UserRoleType = "manager" | "chief_manager" | "accountant" | "head_of_managers" | "director" | "legal" | "dev"

export interface UserType {
    first_name: string;
    last_name: string;
    role: UserRoleType;
    avatar: string;
    phone?: string;
    secret_code?: string;
    id: number;
    email: string;
    created_at: number;
    is_active: number;
}
