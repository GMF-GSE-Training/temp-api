import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { RegisterUserRequest, UserResponse } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';

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
}