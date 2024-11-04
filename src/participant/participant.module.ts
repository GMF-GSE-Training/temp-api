import { HttpException, Module } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { ParticipantService } from "./participant.service";
import { MulterModule } from "@nestjs/platform-express";
import { ParticipantController } from "./participant.controller";
import { extname } from 'path';

@Module({
    imports: [
        
    ],
    providers: [
        PrismaService,
        ParticipantService,
    ],
    controllers: [ParticipantController],
    exports: [ParticipantService],
})
export class ParticipantModule {

}