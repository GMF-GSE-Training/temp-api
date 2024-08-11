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
}