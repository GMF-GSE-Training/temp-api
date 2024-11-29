import { Global, HttpException, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrismaService } from './service/prisma.service';
import { ValidationService } from './service/validation.service';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error/error.filter';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from "@nestjs/platform-express";
import { extname } from 'path';
import { CoreHelper } from './helpers/core.helper';
import { CoreUtil } from 'src/common/utils/core.utils';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            format: winston.format.json(),
            transports: [
                new winston.transports.Console()
            ]
        }),
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
        ValidationService,
        {
            provide: APP_FILTER,
            useClass: ErrorFilter,
        },
        CoreHelper,
        CoreUtil,
    ],
    exports: [
        PrismaService,
        ValidationService,
        JwtModule,
        CoreHelper,
        CoreUtil,
    ],
})
export class CommonModule {

}
