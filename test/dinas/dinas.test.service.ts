import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../src/common/service/prisma.service";

@Injectable()
export class DinasTestService {
    constructor(private prismaService: PrismaService) {
    }

    async deleteDinas() {
        await this.prismaService.dinas.deleteMany({
            where: {
                dinas: 'test',
            }
        });
    }

    async createDinas() {
        await this.prismaService.dinas.create({
            data: {
                dinas: 'test',
            }
        });
    }

    async getDinas() {
        return this.prismaService.dinas.findFirst({
            where: {
                dinas: 'test',
            }
        });
    }
}