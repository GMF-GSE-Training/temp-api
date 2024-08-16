import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { LoginUserRequest, UpdateUserRequest, UserResponse } from "src/model/user.model";
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

    async me(user: User): Promise<UserResponse> {
        await this.prismaService.user.findUnique({
            where: { 
                id: user.id
            },
        });

        if (!user) {
            throw new HttpException('User not found', 404);
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
}