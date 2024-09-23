import { Module } from "@nestjs/common";
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "../common/guard/auth.guard";
import { PrismaService } from "src/common/service/prisma.service";
import { MailerModule } from "src/mailer/mailer.module";
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
        MailerModule,
    ],
    providers: [
        AuthService,
        AuthGuard,
        PrismaService,
    ],
    controllers: [AuthController],
})
export class AuthModule {}
