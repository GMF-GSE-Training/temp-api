import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrismaService } from './service/prisma.service';
import { ValidationService } from './service/validation.service';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error/error.filter';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            format: winston.format.json(),
            transports: [
                new winston.transports.Console()
            ]
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        })
    ],
    providers: [
        PrismaService,
        ValidationService,
        {
            provide: APP_FILTER,
            useClass: ErrorFilter,
        },
    ],
    exports: [
        PrismaService,
        ValidationService,
    ]
})
export class CommonModule {}
