import { Module } from "@nestjs/common";
import { RoleService } from "./role.service";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { PrismaService } from "../common/service/prisma.service";
import { RoleController } from "./role.controller";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "../config/constants";

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1h' },
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