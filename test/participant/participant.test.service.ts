import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../src/common/service/prisma.service";

@Injectable()
export class ParticipantTestService {
    constructor(private prismaService: PrismaService) {
    }

    async delete() {
        await this.prismaService.participant.deleteMany();
    }

}