import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { CreateDinasRequest, DinasResponse } from "../model/dinas.model";
import { DinasValidation } from "./dinas.validation";
import { Dinas } from "@prisma/client";

@Injectable()
export class DinasService{
    constructor(
        private prismaService: PrismaService,
        private validationService: ValidationService,
    ){}

    async create(req: CreateDinasRequest): Promise<DinasResponse> {
        console.log(req);
        const createRequest: CreateDinasRequest = this.validationService.validate(DinasValidation.CREATE, req);

        const checkDinasIsExists = await this.prismaService.dinas.count({
            where: {
                dinas: createRequest.dinas,
            }
        });

        if(checkDinasIsExists != 0) {
            throw new HttpException('Dinas already exists', 400);
        }

        const dinas = await this.prismaService.dinas.create({
            data: createRequest
        });

        return this.toDinasResponse(dinas);
    }

    async getAll(): Promise<DinasResponse[]> {
        const dinas = await this.prismaService.dinas.findMany();

        if(!dinas) {
            throw new HttpException('Dinas Not Found', 404);
        }

        return dinas.map((dinas) => this.toDinasResponse(dinas));
    }

    toDinasResponse(dinas: Dinas) {
        return {
            id: dinas.id,
            dinas: dinas.dinas,
        };
    }
}