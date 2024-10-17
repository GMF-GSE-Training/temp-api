import { HttpException, Module } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { ParticipantService } from "./participant.service";
import { MulterModule } from "@nestjs/platform-express";
import { ParticipantController } from "./participant.controller";
import { extname } from 'path';

@Module({
    imports: [
        MulterModule.register({
            fileFilter: (_req, file, callback) => {
                const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
                const fileExtension = extname(file.originalname).toLowerCase();

                if (!allowedExtensions.includes(fileExtension)) {
                    return callback(new HttpException(`Format file untuk ${file.fieldname} tidak valid. Hanya file dengan format PNG, JPG, JPEG, dan PDF yang diperbolehkan.`, 400), false);
                }
                callback(null, true);
            },
            limits: {
                fileSize: 2 * 1024 * 1024,
            }
        }),
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