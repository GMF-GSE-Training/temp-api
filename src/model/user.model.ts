export interface CreateUserRequest {
    no_pegawai?: string;
    nik?: string;
    email: string;
    name: string;
    password: string;
    dinas?: string;
    roleId: string;
}

export interface UpdateUserRequest {
    no_pegawai?: string;
    nik?: string;
    email?: string;
    name?: string;
    password?: string;
    dinas?: string;
    roleId?: string;
}

export interface UserList {
    id: string;
    no_pegawai?: string;
    email: string;
    name: string;
    dinas?: string;
    roleId: string;
}

export interface UserResponse {
    id: string;
    no_pegawai?: string;
    email: string;
    nik?: string;
    name: string;
    dinas?: string;
    roleId: string;
    role?: {
        id: string,
        role: string;
    }
    links?: {
        self: string;
        update: string;
        delete: string;
    }
}