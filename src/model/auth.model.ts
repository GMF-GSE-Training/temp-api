export interface RegisterUserRequest {
    participantId?: string;
    noPegawai?: string;
    nik: string;
    email: string;
    name: string;
    password: string;
    dinas?: string;
    roleId: string;
}

export interface LoginUserRequest {
    identifier: string;
    password: string;
}

export interface CurrentUserRequest {
    user: {
        id: string,
        noPegawai: string,
        email: string,
        name: string,
        nik: string,
        dinas: string,
        roleId: string,
    }
}

export interface ResetPassword {
    token: string;
    newPassword: string;
    confirmNewPassword: string;
}

export interface AuthResponse {
    id: string;
    participantId?: string;
    noPegawai?: string;
    email?: string;
    name: string;
    dinas?: string;
    roleId?: string;
    token?: string;
    role?: {
        id: string,
        role: string,
    }
}
