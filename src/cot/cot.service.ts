import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CreateCOT } from "src/model/cot.model";
import { CotValidation } from "./cot.validation";

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
}