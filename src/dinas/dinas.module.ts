import { Module } from "@nestjs/common";
import { DinasService } from "./dinas.service";
import { DinasController } from "./dinas.controller";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { PrismaService } from "../common/service/prisma.service";
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
        DinasService,
        AuthGuard,
        RoleGuard,
        PrismaService,
    ],
    controllers: [DinasController],
})
export class DinasModule {

}