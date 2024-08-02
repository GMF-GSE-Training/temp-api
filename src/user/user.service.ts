import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/prisma.service";
import { ValidationService } from "../common/validation.service";
import { LoginUserRequest, RegisterUserRequest, UserResponse } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from "@prisma/client";

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ) {}

    async register(req: RegisterUserRequest): Promise<UserResponse> {
        this.logger.info(`UserService.register(${JSON.stringify(req)})`);

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

        req.roleId = defaultRole.id;

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
            no_pegawai: user.no_pegawai,
            nik: user.nik,
            email: user.email,
            name: user.name,
            dinasId: user.dinasId,
            roleId: user.roleId,
        };
    }

    async login(req: LoginUserRequest): Promise<UserResponse> {
        this.logger.info(`UserService.login(${JSON.stringify(req)})`);

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

        user = await this.prismaService.user.update({
            where: { 
                id: user.id 
            },
            data: { 
                token: uuid(),
            },
        });

        return {
            no_pegawai: user.no_pegawai,
            nik: user.nik,
            email: user.email,
            name: user.name,
            dinasId: user.dinasId,
            roleId: user.roleId,
        };
    }
}