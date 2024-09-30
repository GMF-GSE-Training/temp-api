import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CapabilityResponse, CreateCapability, ListCapabilityResponse } from "src/model/capability.model";
import { CapabilityValidation } from "./capability.validation";
import { ActionAccessRights, ListRequest, Paging } from "src/model/web.model";

@Injectable()
export class CapabilityService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
    ) { }

    async createCapability(request: CreateCapability): Promise<CapabilityResponse> {
        const createCapabilityRequest = this.validationService.validate(CapabilityValidation.CREATE, request);

        const capability = await this.prismaService.capability.create({
            data: createCapabilityRequest,
        });

        return capability;
    }

    async getCapability(capabilityId: string): Promise<any> {
        const capability = await this.prismaService.capability.findUnique({
            where: {
                id: capabilityId,
            }
        });

        if(!capability) {
            throw new HttpException('Capability Not Found', 404);
        }

        const result = await this.prismaService.capability.findMany({
            select: {
                id: true,
                kode_rating: true,
                kode_training: true,
                nama_training: true,
                curriculums: {
                    select: {
                        regulasiGSEs: {
                            select: {
                                id: true,
                                durasi_praktek: true,
                                durasi_teori: true,
                            },
                        },
                        kompetensis: {
                            select: {
                                id: true,
                                durasi_praktek: true,
                                durasi_teori: true,
                            },
                        },
                        total_durasi: true
                    }
                }
            }
        });    

        return result;
    }

    async listCapability(request: ListRequest): Promise<{ data: ListCapabilityResponse[], actions: ActionAccessRights, paging: Paging }> {
        let capability: ListCapabilityResponse[];

        capability = await this.prismaService.capability.findMany({
            select: {
                id: true,
                kode_rating: true,
                kode_training: true,
                nama_training: true,
                curriculums: {
                    select: {
                        regulasiGSEs: {
                            select: {
                                id: true,
                                durasi_praktek: true,
                                durasi_teori: true,
                            },
                        },
                        kompetensis: {
                            select: {
                                id: true,
                                durasi_praktek: true,
                                durasi_teori: true,
                            },
                        },
                        total_durasi: true
                    }
                }
            }
        });    

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
                canView: true,
            },
            paging: {
                current_page: request.page,
                total_page: totalPage,
                size: request.size,
            },
        };
    }
}