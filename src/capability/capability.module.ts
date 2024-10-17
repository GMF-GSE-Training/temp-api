import { Module } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { CapabilityService } from "./capability.service";
import { CapabilityController } from "./capability.controller";

@Module({
    imports: [],
    providers: [
        PrismaService,
        CapabilityService,
    ],
    controllers: [CapabilityController],
})
export class CapabilityModule {

}