import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/prisma.service";
import { ValidationService } from "../common/validation.service";
import { LoginUserRequest, CurrentUserRequest, RegisterUserRequest, UserResponse, UpdateUserRequest } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { User } from "@prisma/client";
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
        private jwtService: JwtService
    ) {}

    async register(req: RegisterUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.register(${JSON.stringify(req)})`);

        const defaultRole = await this.prismaService.role.findFirst({
            where: { 
                role: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });

        if (!defaultRole) {
            throw new HttpException("Role 'user' not found", 500);
        }

        if (!req.roleId) {
            req.roleId = defaultRole.id;
        }

        const registerRequest: RegisterUserRequest = this.validationService.validate(UserValidation.REGISTER, req);

        const totalUserwithSameNoPegawai = await this.prismaService.user.count({
            where: {
                no_pegawai: registerRequest.no_pegawai,
            }
        });

        if(totalUserwithSameNoPegawai != 0) {
            throw new HttpException("No pegawai sudah digunakan", 400);
        }

        const totalUserwithSameEmail = await this.prismaService.user.count({
            where: {
                email: registerRequest.email,
            }
        });

        if(totalUserwithSameEmail != 0) {
            throw new HttpException("Email sudah digunakan", 400);
        }

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
            dinasId: user.dinasId,
            roleId: user.roleId,
        };
    }

    async login(req: LoginUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.login(${JSON.stringify(req)})`);

        const loginRequest: LoginUserRequest = this.validationService.validate(UserValidation.LOGIN, req);

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
            dinasId: user.dinasId,
            roleId: user.roleId,
            token: user.token,
        };
    }

    async me(user: User): Promise<UserResponse> {
        this.logger.debug(`UserService.login(${JSON.stringify(user)})`);

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
            dinasId: user.dinasId,
            roleId: user.roleId,
            token: user.token,
        };
    }

    async updateMe(user: User, req: UpdateUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.update(${user}, ${JSON.stringify(req)})`);

        const updateRequest: UpdateUserRequest = this.validationService.validate(UserValidation.UPDATE, req);

        for (const key of Object.keys(updateRequest)) {
            if (updateRequest[key] !== undefined) {
                if (key === 'password') {
                    user.password = await bcrypt.hash(updateRequest.password, 10);
                } else {
                    (   user as any)[key] = updateRequest[key];
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
            dinasId: result.dinasId,
            roleId: result.roleId,
            token: result.token,
        }
    }

    async logout(user: User): Promise<UserResponse> {
        this.logger.debug(`UserService.login(${JSON.stringify(user)})`);

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
            dinasId: result.dinasId,
            roleId: result.roleId,
        };
    }
}