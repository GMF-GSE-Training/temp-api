import { Module } from "@nestjs/common";
import { CotService } from "./cot.service";
import { CotController } from "./cot.controller";

@Module({
    imports: [],
    providers: [CotService],
    controllers: [CotController],
})
export class CotModule {

}