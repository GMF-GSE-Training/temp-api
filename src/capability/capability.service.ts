import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CapabilityResponse, CreateCapability, UpdateCapability } from "src/model/capability.model";
import { CapabilityValidation } from "./capability.validation";
import { ActionAccessRights, ListRequest, Paging, SearchRequest } from "src/model/web.model";
import { CurrentUserRequest } from "src/model/auth.model";
import { CoreHelper } from "src/common/helpers/core.helper";

@Injectable()
export class CapabilityService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
        private readonly coreHelper: CoreHelper,
    ) { }

    async createCapability(request: CreateCapability): Promise<CapabilityResponse> {
        const createCapabilityRequest = this.validationService.validate(CapabilityValidation.CREATE, request);
    
        await this.coreHelper.ensureUniqueFields('capability', [
            { field: 'ratingCode', value: createCapabilityRequest.ratingCode, message: 'Kode Rating sudah ada' },
            { field: 'trainingCode', value: createCapabilityRequest.trainingCode, message: 'Kode Training sudah ada' },
            { field: 'trainingName', value: createCapabilityRequest.trainingName, message: 'Nama Training sudah ada' },
        ]);        
    
        const capability = await this.prismaService.capability.create({
            data: createCapabilityRequest,
        });
    
        const {
            totalTheoryDurationRegGse, 
            totalPracticeDurationRegGse, 
            totalTheoryDurationCompetency, 
            totalPracticeDurationCompetency, 
            totalDuration,
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
                ratingCode: true,
                trainingCode: true,
                trainingName: true,
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
    
        const capability = await this.prismaService.capability.findUnique({
            where: {
                id: capabilityId,
            }
        });
    
        if(!capability) {
            throw new HttpException('Capability tidak ditemukan', 404);
        }
    
        await this.coreHelper.ensureUniqueFields('capability', [
            { field: 'ratingCode', value: updateCapabilityRequest.ratingCode, message: 'Kode Rating sudah ada' },
            { field: 'trainingCode', value: updateCapabilityRequest.trainingCode, message: 'Kode Training sudah ada' },
            { field: 'trainingName', value: updateCapabilityRequest.trainingName, message: 'Nama Training sudah ada' },
        ], capabilityId);        
    
        await this.prismaService.capability.update({
            where: {
                id: capability.id
            },
            data: updateCapabilityRequest
        });
    
        return 'Capability berhasil diperbarui';
    }

    async deleteCapability(capabilityId: string): Promise<string> {
        let capability = await this.prismaService.capability.findUnique({
            where: {
                id: capabilityId
            }
        });
    
        if(!capability) {
            throw new HttpException('Capability tidak ditemukan', 404);
        }

        await this.prismaService.$transaction(async (prisma) => {
            // Hapus curriculumSyllabus terkait capabilityId
            await prisma.curriculumSyllabus.deleteMany({
                where: {
                    capabilityId: capabilityId,
                },
            });
        
            // Hapus capability
            await prisma.capability.delete({
                where: {
                    id: capabilityId,
                },
            });
        });
    
        return 'Capability berhasil dihapus';
    }

    async getAllCapability(): Promise<CapabilityResponse[]> {
        const capability = await this.prismaService.capability.findMany();
        return capability.map(item => ({
            id: item.id,
            ratingCode: item.ratingCode,
            trainingCode: item.trainingCode,
            trainingName: item.trainingName,
        }));
    }

    async listCapability(user: CurrentUserRequest, request: ListRequest): Promise<{ data: CapabilityResponse[], actions: ActionAccessRights, paging: Paging }> {
        const capability = await this.prismaService.capability.findMany({
            take: request.size,
            skip: (request.page - 1) * request.size,
        });
    
        const totalCapability = await this.prismaService.capability.count();
    
        const capabilitiesWithFilteredAttributes = capability.map(this.mapCapabilityWithDurations);
    
        const totalPage = Math.ceil(totalCapability / request.size);
    
        const userRole = user.role.name.toLowerCase();
        const actions = this.validateActions(userRole);
    
        return {
            data: capabilitiesWithFilteredAttributes,
            actions: actions,
            paging: {
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            },
        };
    }

    async searchCapability(request: SearchRequest, user: CurrentUserRequest): Promise<{ data: CapabilityResponse[], actions: ActionAccessRights, paging: Paging }> {
        const query = request.searchQuery.toLowerCase();
    
        // Ambil total jumlah data yang cocok dengan filter
        const totalCapability = await this.prismaService.capability.count({
            where: {
                OR: [
                    { ratingCode: { contains: query, mode: 'insensitive' } },
                    { trainingCode: { contains: query, mode: 'insensitive' } },
                    { trainingName: { contains: query, mode: 'insensitive' } },
                ],
            },
        });
    
        // Ambil data capability sesuai paginasi dan query
        const capabilities = await this.prismaService.capability.findMany({
            where: {
                OR: [
                    { ratingCode: { contains: query, mode: 'insensitive' } },
                    { trainingCode: { contains: query, mode: 'insensitive' } },
                    { trainingName: { contains: query, mode: 'insensitive' } },
                ],
            },
            skip: (request.page - 1) * request.size,
            take: request.size,
        });
    
        // Hitung total duration untuk setiap capability
        const capabilitiesWithFilteredAttributes = capabilities.map(this.mapCapabilityWithDurations);
    
        // Hitung total halaman
        const totalPage = Math.ceil(totalCapability / request.size);
    
        const userRole = user.role.name.toLowerCase();
        const actions = this.validateActions(userRole);
    
        return {
            data: capabilitiesWithFilteredAttributes,
            actions: actions,
            paging: {
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            }
        }
    }

    private validateActions(userRole: string): ActionAccessRights {
        const accessMap = {
            'super admin': { canEdit: true, canDelete: true },
            'supervisor': { canEdit: false, canDelete: false },
            'lcu': { canEdit: false, canDelete: false },
            'user': { canEdit: false, canDelete: false },
        }
    
        return this.coreHelper.validateActions(userRole, accessMap);
    }

    private mapCapabilityWithDurations(capability: any): any {
        const { 
            totalTheoryDurationRegGse, 
            totalPracticeDurationRegGse, 
            totalTheoryDurationCompetency, 
            totalPracticeDurationCompetency, 
            ...rest 
        } = capability;
    
        const totalMaterialDurationRegGse = (totalTheoryDurationRegGse || 0) + (totalPracticeDurationRegGse || 0);
        const totalMaterialDurationCompetency = (totalTheoryDurationCompetency || 0) + (totalPracticeDurationCompetency || 0);
    
        return {
            ...rest,
            totalMaterialDurationRegGse,
            totalMaterialDurationCompetency,
        };
    }
}