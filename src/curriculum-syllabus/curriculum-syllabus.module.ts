import { Module } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { CurriculumSyllabusService } from "./curriculum-syllabus.service";
import { CurriculumSyllabusController } from "./curriculum-syllabus.controller";

@Module({
    imports: [],
    providers: [
        PrismaService,
        CurriculumSyllabusService
    ],
    controllers: [CurriculumSyllabusController],
})
export class CurriculumSyllabusModule {

}