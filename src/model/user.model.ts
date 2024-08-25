export interface CreateUserRequest {
    no_pegawai?: string;
    nik?: string;
    email: string;
    name: string;
    password: string;
    dinas?: string;
    roleId: number;
}

export interface UpdateUserRequest {
    id: number;
    no_pegawai?: string;
    email?: string;
    name?: string;
    password?: string;
    dinas?: string;
    roleId?: number;
}

export interface ListUserRequest {
    page?: number,
    size?: number,
}

export interface SearchUserRequest {
    searchQuery: string;
    page: number;
    size: number;
}

export interface UserResponse {
    id: number;
    no_pegawai?: string;
    nik?: string;
    email: string;
    name: string;
    dinas?: string;
    roleId: number;
    token?: string;
    links: {
        self: string;
        update: string;
        delete: string;
    }
}