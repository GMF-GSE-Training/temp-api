import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { UpdateUserRequest, UserResponse } from "../model/user.model";
import { AuthResponse, RegisterUserRequest } from "../model/auth.model";
import { LoginUserRequest } from "../model/auth.model";
import { Logger } from "winston";
import { AuthValidation } from "./auth.validation";
import { User } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt'; 

@Injectable()
export class AuthService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
        private jwtService: JwtService,
    ) {}

    async register(req: RegisterUserRequest): Promise<UserResponse> {
        if(req.roleId) {
            throw new HttpException('Anda tidak berhak menentukan role', 403);
        }

        const defaultRole = await this.prismaService.role.findFirst({
            where: { 
                role: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });

        if (!defaultRole) {
            throw new HttpException("Role tidak ditemukan", 404);
        }

        req.roleId = defaultRole.id;

        const registerRequest: RegisterUserRequest = this.validationService.validate(AuthValidation.REGISTER, req);

        const participant = await this.prismaService.participant.findUnique({
            where: {
                nik: req.nik,
            }
        });

        if(!participant) {
            throw new HttpException('NIK tidak ada di data participant', 400);
        }

        if (registerRequest.email !== participant.email) {
            throw new HttpException('Email tidak sesuai dengan data participant', 400);
        }

        if (registerRequest.no_pegawai && registerRequest.no_pegawai !== participant.no_pegawai) {
            throw new HttpException('No Pegawai tidak sesuai dengan data participant', 400);
        }

        if (registerRequest.dinas && registerRequest.dinas !== participant.dinas) {
            throw new HttpException('Dinas tidak sesuai dengan data participant', 400);
        }

        await this.checkUserExists(registerRequest.no_pegawai, registerRequest.email);

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const user = await this.prismaService.user.create({
            data: registerRequest,
        });
        
        return {
            id: user.id,
            no_pegawai: user.no_pegawai,
            nik: user.nik,
            email: user.email,
            name: user.name,
            dinas: user.dinas,
            roleId: user.roleId,
        }
    }
    
    async login(req: LoginUserRequest): Promise<UserResponse> {
        const loginRequest: LoginUserRequest = this.validationService.validate(AuthValidation.LOGIN, req);

        let user: User;
        if(loginRequest.identifier.includes('@')) {
            user = await this.prismaService.user.findFirst({
                where: {
                    email: loginRequest.identifier,
                }
            });
        } else {
            user = await this.prismaService.user.findFirst({
                where: {
                    no_pegawai: loginRequest.identifier
                }
            });
        }

        if(!user) {
            throw new HttpException('no_pegawai or email or password is invalid', 401);
        }

        const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);

        if(!isPasswordValid) {
            throw new HttpException('no_pegawai or email or password is invalid', 401);
        }

        const payload = { sub: user.id };

        try {
            user = await this.prismaService.user.update({
                where: { 
                    id: user.id 
                },
                data: { 
                    token: await this.jwtService.signAsync(payload),
                },
            });
        } catch (error) {
            throw new HttpException('Failed to generate token', 500);
        }

        return {
            id: user.id,
            no_pegawai: user.no_pegawai,
            nik: user.nik,
            email: user.email,
            name: user.name,
            dinas: user.dinas,
            roleId: user.roleId,
            token: user.token,
        };
    }

    async me(user: User): Promise<AuthResponse> {
        const result = await this.prismaService.user.findUnique({
            where: { 
                id: user.id
            },
            include: {
                role: true,
            }
        });

        if (!result) {
            throw new HttpException('User not found', 404);
        }

        return this.toAuthResponse(result);
    }

    async updateMe(user: User, req: UpdateUserRequest): Promise<UserResponse> {
        if(req.roleId) {
            const userCurrent = await this.prismaService.user.findUnique({
                where: {
                    id: user.id,
                },
                include: {
                    role: true,
                }
            });
    
            if(!userCurrent) {
                throw new HttpException('User not found', 404);
            }
    
            const restrictedRoles = ['user', 'lcu', 'supervisor'];
            if (restrictedRoles.includes(userCurrent.role.role.toLowerCase())) {
                throw new HttpException('Forbidden: You are not allowed to update your role', 403);
            }
        }

        const updateRequest: UpdateUserRequest = this.validationService.validate(AuthValidation.UPDATE, req);

        for (const key of Object.keys(updateRequest)) {
            if (updateRequest[key] !== undefined) {
                if (key === 'password') {
                    user.password = await bcrypt.hash(updateRequest.password, 10);
                } else {
                    (user as any)[key] = updateRequest[key];
                }
            }
        }   

        const result = await this.prismaService.user.update({
            where: {
                id: user.id,
            },
            data: user,
        });

        return {
            id: result.id,
            no_pegawai: result.no_pegawai,
            nik: result.nik,
            email: result.email,
            name: result.name,
            dinas: result.dinas,
            roleId: result.roleId,
            token: result.token,
        }
    }

    async logout(user: User): Promise<UserResponse> {
        const result = await this.prismaService.user.update({
            where: {
                id: user.id,
            },
            data: {
                token: null,
            }
        });

        return {
            id: result.id,
            no_pegawai: result.no_pegawai,
            nik: result.nik,
            email: result.email,
            name: result.name,
            dinas: result.dinas,
            roleId: result.roleId,
        };
    }

    async checkUserExists(no_pegawai: string, email: string) {
        if (no_pegawai) {
            const totalUserwithSameNoPegawai = await this.prismaService.user.count({
                where: {
                    no_pegawai: no_pegawai,
                }
            });
    
            if (totalUserwithSameNoPegawai != 0) {
                throw new HttpException("No pegawai sudah digunakan", 400);
            }
        }

        const totalUserwithSameEmail = await this.prismaService.user.count({
            where: {
                email: email,
            }
        });

        if(totalUserwithSameEmail != 0) {
            throw new HttpException("Email sudah digunakan", 400);
        }
    }

    toAuthResponse(user: AuthResponse) {
        return {
            id: user.id,
            no_pegawai: user.no_pegawai,
            nik: user.nik,
            email: user.email,
            name: user.name,
            dinas: user.dinas,
            roleId: user.roleId,
            token: user.token,
            role: {
                id: user.role.id,
                role: user.role.role,
            }
        };
    }
}