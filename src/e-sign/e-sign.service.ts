import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CreateESign, ESignResponse } from "src/model/e-sign.model";
import { ESignValidation } from "./e-sign.validation";
import { ActionAccessRights, ListRequest, Paging } from "src/model/web.model";

@Injectable()
export class ESignService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
    ) { }

    async createESign(request: CreateESign): Promise<string> {
        const eSignRequest = this.validationService.validate(ESignValidation.CREATE, request);
        const totalESingwithSameNoPegawai = await this.prismaService.signature.count({
            where: {
                noPegawai: eSignRequest.noPegawai,
            }
        });

        if (totalESingwithSameNoPegawai != 0) {
            throw new HttpException("No pegawai sudah digunakan", 400);
        }

        await this.prismaService.signature.create({
            data: eSignRequest
        });

        return 'E-Sign berhasil ditambahkan';
    }

    async listESign(request: ListRequest): Promise<{ data: ESignResponse[], actions: ActionAccessRights, paging: Paging }> {
        const eSign = await this.prismaService.signature.findMany({
            select: {
                noPegawai: true,
                role: true,
                name: true,
                status: true
            }
        });

        const totalCot = eSign.length;
        const totalPage = Math.ceil(totalCot / request.size);
        const paginateESign = eSign.slice(
            (request.page - 1) * request.size,
            request.page * request.size
        );

        if (paginateESign.length === 0) {
            throw new HttpException("Data tidak ditemukan", 404);
        }

        return {
            data: paginateESign,
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