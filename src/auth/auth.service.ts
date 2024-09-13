import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { UpdateUserRequest } from "../model/user.model";
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

    async register(req: RegisterUserRequest): Promise<AuthResponse> {
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
            throw new HttpException('NIK tidak ada di data peserta', 400);
        }

        if (registerRequest.email !== participant.email) {
            throw new HttpException('Email tidak sesuai dengan data peserta', 400);
        }

        if (participant.no_pegawai && registerRequest.no_pegawai !== participant.no_pegawai) {
            throw new HttpException('No Pegawai tidak sesuai dengan data peserta', 400);
        }

        if (participant.dinas && registerRequest.dinas !== participant.dinas) {
            throw new HttpException('Dinas tidak sesuai dengan data peserta', 400);
        }

        await this.checkUserExists(registerRequest.no_pegawai, registerRequest.email);

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const authSelectedFields = this.authSelectedFields();

        const user = await this.prismaService.user.create({
            data: registerRequest,
            select: authSelectedFields,
        });

        const result = {
            ...user,
            links: this.links(),
        }
        
        return this.toAuthResponse(result);
    }
    
    async login(req: LoginUserRequest): Promise<AuthResponse> {
        const loginRequest: LoginUserRequest = this.validationService.validate(AuthValidation.LOGIN, req);

        let user;
        if(loginRequest.identifier.includes('@')) {
            user = await this.prismaService.user.findFirst({
                where: {
                    email: loginRequest.identifier,
                },
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
        const authSelectedFields = this.authSelectedFields();

        try {
            const token = await this.jwtService.signAsync(payload);
            user = await this.prismaService.user.update({
                where: { 
                    id: user.id 
                },
                data: { 
                    token 
                },
                select: authSelectedFields,
            });
        } catch (error) {
            throw new HttpException('Failed to generate token', 500);
        }

        return this.toAuthResponse(user);
    }

    async me(me: User): Promise<AuthResponse> {
        const user = await this.prismaService.user.findUnique({
            where: { 
                id: me.id
            },
            include: {
                role: true,
            }
        });

        if (!user) {
            throw new HttpException('User not found', 404);
        }
        return {
            id: user.id,
            name: user.name,
            links: this.links(),
            role: {
                id: user.role.id,
                role: user.role.role,
            }
        }
    }

    async updateCurrent(user: User, req: UpdateUserRequest): Promise<AuthResponse> {
        if(req.roleId) {
            const userCurrent = await this.prismaService.user.findUnique({
                where: {
                    id: user.id,
                },
                include: {
                    role: true,
                },
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

        const authSelectedFields = this.authSelectedFields();

        const result = await this.prismaService.user.update({
            where: {
                id: user.id,
            },
            data: user,
            select: authSelectedFields,
        });

        return this.toAuthResponse({
            ...result,
            links: this.links(),
        });
    }

    async logout(user: User): Promise<AuthResponse> {
        const authSelectedFields = this.authSelectedFields();
        const result = await this.prismaService.user.update({
            where: {
                id: user.id,
            },
            data: {
                token: null,
            },
            select: authSelectedFields,
        });

        return this.toAuthResponse({
            ...result,
            links: this.links(),
        });
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

    authSelectedFields() {
        return {
            id: true,
            no_pegawai: true,
            email: true,
            name: true,
            dinas: true,
            roleId: true,
            token: true,
        }
    }

    links() {
        return {
            self: '/auth/current',
            update: `/auth/current`,
            delete: `/auth/current`,
        }
    }

    toAuthResponse(user: AuthResponse): AuthResponse {
        return {
            id: user.id,
            no_pegawai: user.no_pegawai,
            email: user.email,
            name: user.name,
            dinas: user.dinas,
            roleId: user.roleId,
            token: user.token,
            links: this.links(),
        };
    }
}