import { User } from "@prisma/client";

export interface LoginUserRequest {
    identifier: string;
    password: string;
}

export interface CurrentUserRequest {
    user: User;
}

export interface AuthResponse {
    id: number;
    no_pegawai?: string;
    nik?: string;
    email: string;
    name: string;
    dinas?: string;
    roleId: number;
    token?: string;
    role: {
        id: number;
        role: string;
    };
}
