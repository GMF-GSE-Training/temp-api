import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../src/common/service/prisma.service";

@Injectable()
export class RoleTestService {
    constructor(private prismaService: PrismaService) {
    }

    async deleteRole() {
        await this.prismaService.role.deleteMany({
            where: {
                OR: [
                    { role: 'test' },
                    { role: 'test updated' }
                ]
            }
        });
    }

    async getRole() {
        return this.prismaService.role.findFirst({
            where: {
                role: 'test',
            }
        });
    }

    async createRole() {
        await this.prismaService.role.create({
            data: {
                role: 'test',
            }
        });
    }
}