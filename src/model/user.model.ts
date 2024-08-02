export class RegisterUserRequest {
    no_pegawai?: string;
    nik?: string;
    email: string;
    name: string;
    password: string;
    dinasId: number;
    roleId: number;
}

export class LoginUserRequest {
    identifier: string;
    password: string;
}

export class UserResponse {
    no_pegawai?: string;
    nik?: string;
    email: string;
    name: string;
    dinasId?: number;
    roleId: number;
    token?: string;
}