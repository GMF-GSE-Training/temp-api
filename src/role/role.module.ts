import { Module } from "@nestjs/common";
import { RoleService } from "./role.service";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { PrismaService } from "../common/service/prisma.service";
import { RoleController } from "./role.controller";
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
        RoleService,
        AuthGuard,
        RoleGuard,
        PrismaService,
    ],
    controllers: [RoleController],
})
export class RoleModule {

}