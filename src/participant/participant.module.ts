import { HttpException, Module } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { ParticipantService } from "./participant.service";
import { MulterModule } from "@nestjs/platform-express";
import { ParticipantController } from "./participant.controller";
import { extname } from 'path';
import { SharedModule } from "src/shared/shared.module";

@Module({
    imports: [SharedModule],
    providers: [
        PrismaService,
        ParticipantService,
    ],
    controllers: [ParticipantController],
    exports: [ParticipantService],
})
export class ParticipantModule {

}