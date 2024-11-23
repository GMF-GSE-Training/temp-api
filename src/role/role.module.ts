import { Module } from "@nestjs/common";
import { RoleService } from "./role.service";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { PrismaService } from "../common/service/prisma.service";
import { RoleController } from "./role.controller";
import { SharedModule } from "src/shared/shared.module";

@Module({
    imports: [SharedModule],
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