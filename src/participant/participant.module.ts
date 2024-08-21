import { HttpException, Module } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { PrismaService } from "../common/service/prisma.service";
import { RoleGuard } from "../common/guard/role.guard";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../config/constants";
import { ParticipantService } from "./participant.service";
import { MulterModule } from "@nestjs/platform-express";
import { ParticipantController } from "./participant.controller";
import { extname } from 'path';

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1h' },
        }),
        MulterModule.register({
            fileFilter: (_req, file, callback) => {
                const allowedExtensions = ['.png', '.jpg', '.jpeg'];
                const fileExtension = extname(file.originalname).toLowerCase();

                if (!allowedExtensions.includes(fileExtension)) {
                    return callback(new HttpException(`Invalid file format for ${file.fieldname}. Only PNG, JPG, and JPEG are allowed.`, 400), false);
                }
                callback(null, true);
            }
        }),
    ],
    providers: [
        AuthGuard,
        RoleGuard,
        PrismaService,
        ParticipantService,
    ],
    controllers: [ParticipantController],
})
export class ParticipantModule {

}