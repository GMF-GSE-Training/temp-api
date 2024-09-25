import { HttpException, Module } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { PrismaService } from "../common/service/prisma.service";
import { RoleGuard } from "../common/guard/role.guard";
import { JwtModule } from "@nestjs/jwt";
import { ParticipantService } from "./participant.service";
import { MulterModule } from "@nestjs/platform-express";
import { ParticipantController } from "./participant.controller";
import { extname } from 'path';
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('ACCESS_TOKEN'),
                signOptions: {
                    expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
                },
            }),
        }),
        MulterModule.register({
            fileFilter: (_req, file, callback) => {
                const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
                const fileExtension = extname(file.originalname).toLowerCase();

                if (!allowedExtensions.includes(fileExtension)) {
                    return callback(new HttpException(`Invalid file format for ${file.fieldname}. Only PNG, JPG, JPEG, and PDF are allowed.`, 400), false);
                }
                callback(null, true);
            },
            limits: {
                fileSize: 2 * 1024 * 1024,
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
    exports: [ParticipantService],
})
export class ParticipantModule {

}