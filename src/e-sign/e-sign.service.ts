import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CreateESign } from "src/model/e-sign.model";
import { ESignValidation } from "./e-sign.validation";

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
}