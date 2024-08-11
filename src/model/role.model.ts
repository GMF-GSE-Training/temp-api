export interface CreateRoleRequest {
    role: string;
}

export interface UpdateRoleRequest {
    role?: string;
}

export interface RoleResponse {
    id: number;
    role: string;
}