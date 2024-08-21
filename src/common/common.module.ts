import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { PrismaService } from './service/prisma.service';
import { ValidationService } from './service/validation.service';
import { APP_FILTER } from '@nestjs/core';
import { ErrorFilter } from './error/error.filter';
import { StaticFileMiddleware } from './middleware/static_file.middleware';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../config/constants';

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
        }),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1h' },
        }),
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
export class CommonModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(StaticFileMiddleware)
            .forRoutes('/uploads/*');
    }
}
