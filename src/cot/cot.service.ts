import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CotResponse, CreateCOT, UpdateCot } from "src/model/cot.model";
import { CotValidation } from "./cot.validation";
import { ActionAccessRights, ListRequest, Paging } from "src/model/web.model";

@Injectable()
export class CotService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
    ) { }

    async createCot(request: CreateCOT): Promise<string> {
        request.status = true;
        request.tanggalMulai = new Date(request.tanggalMulai);
        request.tanggalSelesai = new Date(request.tanggalSelesai);

        const createCotRequest = this.validationService.validate(CotValidation.CREATE, request);

        const capabilityCount = await this.prismaService.cOT.count({
            where: {
                capabilityId: request.capabilityId
            }
        });

        if(capabilityCount > 0) {
            throw new HttpException('COT sudah ada', 404);
        }

        await this.prismaService.cOT.create({
            data: createCotRequest
        });

        return 'Cot berhasil dibuat';
    }

    async getCot(cotId: string): Promise<CotResponse> {
        const cot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId
            },
            include: {
                Capabillity: true
            }
        });

        if(!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        return cot;
    }

    async updateCot(cotId: string, request: UpdateCot): Promise<string> {
        const updateCotRequest = this.validationService.validate(CotValidation.UPDATE, request);
        const cot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId
            }
        });

        if(!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        await this.prismaService.cOT.update({
            where: {
                id: cotId
            },
            data: updateCotRequest
        });

        return 'COT berhasil diperbarui';
    }

    async listCot(request: ListRequest): Promise<{ data: CotResponse[], actions: ActionAccessRights, paging: Paging }> {
        const cot = await this.prismaService.cOT.findMany({
            include: {
                Capabillity: true
            }
        });

        const totalCot = cot.length;
        const totalPage = Math.ceil(totalCot / request.size);
        const paginateCot = cot.slice(
            (request.page - 1) * request.size,
            request.page * request.size
        );

        if (paginateCot.length === 0) {
            throw new HttpException("Data tidak ditemukan", 404);
        }

        return {
            data: paginateCot,
            actions:{
                canEdit: true,
                canDelete: true,
                canView: true,
            },
            paging: {
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            },
        };
    }
}