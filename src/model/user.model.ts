export class RegisterUserRequest {
    no_pegawai?: string;
    nik: string;
    email: string;
    name: string;
    password: string;
    confirm_password: string;
    dinasId?: number;
}

export class UserResponse {
    no_pegawai?: string;
    nik: string;
    email: string;
    name: string;
    dinasId?: number;
    token?: string;
}