import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "src/common/prisma.service";
import { ValidationService } from "src/common/validation.service";
import { RegisterUserRequest, UserResponse } from "src/model/user.model";
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
        this.logger.info(`Register new user ${JSON.stringify(req)}`);
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

        const defaultRole = await this.prismaService.role.findFirst({
            where: {
                role: "user"
            }
        });

        if(registerRequest.roleId == null) {
            registerRequest.roleId = defaultRole.id
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
}