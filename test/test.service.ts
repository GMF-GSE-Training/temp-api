import { Injectable } from "@nestjs/common";
import { PrismaService } from "../src/common/prisma.service";

@Injectable()
export class TestService {
    constructor(private prismaService: PrismaService) {
    }

    async deleteUser() {
        await this.prismaService.user.deleteMany({
            where: {
                email: 'test@example.com'
            }
        });
    }
}