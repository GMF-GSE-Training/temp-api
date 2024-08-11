import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../src/common/service/prisma.service";

@Injectable()
export class RoleTestService {
    constructor(private prismaService: PrismaService) {
    }

    async deleteRole() {
        await this.prismaService.role.deleteMany({
            where: {
                role: 'test',
            }
        });
    }
}