import { Module } from "@nestjs/common";
import { CotService } from "./cot.service";
import { CotController } from "./cot.controller";
import { SharedModule } from "src/shared/shared.module";

@Module({
    imports: [SharedModule],
    providers: [CotService],
    controllers: [CotController],
})
export class CotModule {

}