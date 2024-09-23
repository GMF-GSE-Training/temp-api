import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { AuthGuard } from "../common/guard/auth.guard";
import { PrismaService } from "../common/service/prisma.service";
import { RoleGuard } from "../common/guard/role.guard";
import { JwtModule } from "@nestjs/jwt";
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
    ],
    providers: [
        UserService,
        AuthGuard,
        RoleGuard,
        PrismaService,
    ],
    controllers: [UserController,],
})
export class UserModule {

}