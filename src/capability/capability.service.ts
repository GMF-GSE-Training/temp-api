import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CreateCapability } from "src/model/capability.model";
import { CapabilityValidation } from "./capability.validation";
import { ActionAccessRights, ListRequest, Paging } from "src/model/web.model";

@Injectable()
export class CapabilityService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
    ) { }

    async createCapability(request: CreateCapability): Promise<any> {
        const createCapabilityRequest = this.validationService.validate(CapabilityValidation.CREATE, request);

        const capability = await this.prismaService.capability.create({
            data: createCapabilityRequest,
        });

        return capability;
    }

    async getCapability(capabilityId: string): Promise<any> {
        const result = await this.prismaService.capability.findUnique({
            where: {
                id: capabilityId,
            }
        });

        if(!result) {
            throw new HttpException('Capability Not Found', 404);
        }

        return result;
    }

    async listCapability(request: ListRequest): Promise<{ data: any[], actions: ActionAccessRights, paging: Paging }> {
        let capability: any[];

        capability = await this.prismaService.capability.findMany();    

        const totalCapability = capability.length;
        const totalPage = Math.ceil(totalCapability / request.size);
        const paginateCapability = capability.slice(
            (request.page - 1) * request.size,
            request.page * request.size
        );

        if (paginateCapability.length === 0) {
            throw new HttpException("Data tidak ditemukan", 404);
        }

        return {
            data: paginateCapability,
            actions:{
                canEdit: true,
                canDelete: true,
                canView: false,
            },
            paging: {
                current_page: request.page,
                total_page: totalPage,
                size: request.size,
            },
        };
    }
}