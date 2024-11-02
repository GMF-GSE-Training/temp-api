export interface CreateUserRequest {
    participantId: string;
    noPegawai?: string;
    nik?: string;
    email: string;
    name: string;
    password: string;
    dinas?: string;
    roleId: string;
}

export interface UpdateUserRequest {
    noPegawai?: string;
    nik?: string;
    email?: string;
    name?: string;
    password?: string;
    dinas?: string;
    roleId?: string;
}

export interface UserList {
    id: string;
    noPegawai?: string;
    email: string;
    name: string;
    dinas?: string;
    roleId: string;
}

export interface UserResponse {
    id: string;
    participantId?: string;
    noPegawai?: string;
    email: string;
    nik?: string;
    name: string;
    dinas?: string;
    roleId: string;
    role?: {
        id: string,
        role: string;
    }
}