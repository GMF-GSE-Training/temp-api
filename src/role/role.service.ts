import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { Logger } from 'winston';
import { CreateRoleRequest, RoleResponse, UpdateRoleRequest } from "src/model/role.model";
import { RoleValidation } from "./role.validation";
import { Role } from "@prisma/client";

@Injectable()
export class RoleService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ){}

    async create(req: CreateRoleRequest): Promise<RoleResponse> {
        const createRequest: CreateRoleRequest = this.validationService.validate(RoleValidation.CREATE, req);

        const checkRoleIsExists = await this.prismaService.role.count({
            where: {
                role: createRequest.role,
            }
        });

        if(checkRoleIsExists != 0) {
            throw new HttpException('Role sudah ada', 400);
        }

        const role = await this.prismaService.role.create({
            data: createRequest,
        });

        return this.toRoleResponse(role);
    }

    async getAll(): Promise<RoleResponse[]> {
        const roles = await this.prismaService.role.findMany();

        if(!roles) {
            throw new HttpException('Role tidak ditemukan', 404);
        }

        return roles.map((role) => this.toRoleResponse(role));
    }

    async update(roleId: number, req: UpdateRoleRequest): Promise<RoleResponse> {
        const updateRequest: UpdateRoleRequest = this.validationService.validate(RoleValidation.UPDATE, req);

        const role = await this.prismaService.role.findUnique({
            where: {
                id: roleId,
            }
        });

        if(!role) {
            throw new HttpException('Role tidak ditemukan', 404);
        }

        const result = await this.prismaService.role.update({
            where: {
                id: role.id
            },
            data: updateRequest,
        });

        return this.toRoleResponse(result);
    }

    async delete(roleId: number): Promise<RoleResponse> {
        const role = await this.prismaService.role.findUnique({
            where: {
                id: roleId,
            }
        });

        if(!role) {
            throw new HttpException('Role tidak ditemukan', 404);
        }

        return this.toRoleResponse(role);
    }

    toRoleResponse(role: Role) {
        return {
            id: role.id,
            role: role.role,
        }
    }
}