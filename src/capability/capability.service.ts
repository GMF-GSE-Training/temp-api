import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CapabilityResponse, CreateCapability, UpdateCapability } from "src/model/capability.model";
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

        const capabilityCount = await this.prismaService.capability.count({
            where: {
                OR: [
                    { kodeRating: createCapabilityRequest.kodeRating },
                    { kodeTraining: createCapabilityRequest.kodeTraining },
                    { namaTraining: createCapabilityRequest.namaTraining },
                ]
            }
        });

        if(capabilityCount > 0) {
            throw new HttpException('Capability sudah ada', 400);
        }

        const capability = await this.prismaService.capability.create({
            data: createCapabilityRequest,
        });

        const {
            totalDurasiTeoriRegGse, 
            totalDurasiPraktekRegGse, 
            totalDurasiPraktekKompetensi, 
            totalDurasiTeoriKompetensi, 
            totalDurasi,
            ...result
        } = capability;

        return result;
    }

    async getCapability(capabilityId: string): Promise<CapabilityResponse> {
        const capability = await this.prismaService.capability.findUnique({
            where: {
                id: capabilityId,
            },
            select: {
                id: true,
                kodeRating: true,
                kodeTraining: true,
                namaTraining: true,
                curriculumSyllabus: true,
            },
        });

        if(!capability) {
            throw new HttpException('Capability Not Found', 404);
        }

        return capability;
    }

    async updateCapability(capabilityId: string, req: UpdateCapability): Promise<string> {
        const updateCapabilityRequest = this.validationService.validate(CapabilityValidation.UPDATE, req);
        console.log(req);

        const capability = await this.prismaService.capability.findUnique({
            where: {
                id: capabilityId,
            }
        });

        if(!capability) {
            throw new HttpException('Capability tidak ditemukan', 404);
        }

        await this.prismaService.capability.update({
            where: {
                id: capability.id
            },
            data: updateCapabilityRequest
        });

        return 'Capability berhasil diperbarui';
    }

    async listCapability(request: ListRequest): Promise<{ data: CapabilityResponse[], actions: ActionAccessRights, paging: Paging }> {
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
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            },
        };
    }
}