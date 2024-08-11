import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { RegisterUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { User } from "@prisma/client";

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
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
            throw new HttpException("Not Found", 404);
        }

        if (!req.roleId) {
            req.roleId = defaultRole.id;
        }

        const registerRequest: RegisterUserRequest = this.validationService.validate(UserValidation.REGISTER, req);

        await this.checkUserExists(registerRequest.no_pegawai, registerRequest.email);

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const user = await this.prismaService.user.create({
            data: registerRequest,
        });

        
        return this.toContactResponse(user);
    }

    async createUser(req: RegisterUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.register(${JSON.stringify(req)})`);

        const createRequest: RegisterUserRequest = this.validationService.validate(UserValidation.REGISTER, req);

        await this.checkUserExists(createRequest.no_pegawai, createRequest.email);

        createRequest.password = await bcrypt.hash(createRequest.password, 10);

        const user = await this.prismaService.user.create({
            data: createRequest,
        });

        
        return this.toContactResponse(user);
    }

    async getUserById(userId: number): Promise<UserResponse> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            }
        });

<<<<<<< HEAD
=======
        console.log(user)

>>>>>>> 26e7f240b1e5c39b1f62d1df44880af5801b880a
        if(!user) {
            throw new HttpException('User Not Found', 404);
        }

        return this.toContactResponse(user);
    }

    async updateUser(req: UpdateUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.register(${JSON.stringify(req)})`);

        const updateRequest: UpdateUserRequest = this.validationService.validate(UserValidation.UPDATE, req);

        for (const key of Object.keys(updateRequest)) {
            if (updateRequest[key] !== undefined) {
                if (key === 'password') {
                    updateRequest.password = await bcrypt.hash(updateRequest.password, 10);
                } else {
                    (updateRequest as any)[key] = updateRequest[key];
                }
            }
        }

        const result = await this.prismaService.user.update({
            where: {
                id: req.id,
            },
            data: updateRequest,
        });
        
        return this.toContactResponse(result);
    }

    async checkUserExists(no_pegawai: string, email: string) {
        const totalUserwithSameNoPegawai = await this.prismaService.user.count({
            where: {
                no_pegawai: no_pegawai,
            }
        });

        if(totalUserwithSameNoPegawai != 0) {
            throw new HttpException("No pegawai sudah digunakan", 400);
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

    toContactResponse(user: User) {
        return {
            id: user.id,
            no_pegawai: user.no_pegawai,
            nik: user.nik,
            email: user.email,
            name: user.name,
            dinasId: user.dinasId,
            roleId: user.roleId,
        }
    }
}