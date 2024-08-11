import { Module } from "@nestjs/common";
import { UserTestService } from "../user/user.test.service";
import { DinasTestService } from "./dinas.test.service";

@Module({
    providers: [
        UserTestService,
        DinasTestService,
    ],
})
export class DinasTestModule {

}