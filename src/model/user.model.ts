import { User } from '@prisma/client';

export interface RegisterUserRequest {
    no_pegawai?: string;
    nik: string;
    email: string;
    name: string;
    password: string;
    dinas?: string;
    roleId: number;
}

export interface CreateUserRequest {
    no_pegawai?: string;
    nik?: string;
    email: string;
    name: string;
    password: string;
    dinas?: string;
    roleId: number;
}

export interface LoginUserRequest {
    identifier: string;
    password: string;
}

export interface CurrentUserRequest {
    user: User;
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
}