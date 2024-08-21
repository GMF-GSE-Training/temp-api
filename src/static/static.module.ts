import { Module } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { PrismaService } from "../common/service/prisma.service";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../config/constants";
import { StaticController } from "./static.controller";
import { StaticService } from "./static.service";

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [
        AuthGuard,
        RoleGuard,
        PrismaService,
        StaticService,
    ],
    controllers: [StaticController],
})
export class StaticModule {

}