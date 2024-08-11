import { Module } from "@nestjs/common";
import { UserTestService } from "./user.test.service";

@Module({
    providers: [UserTestService]
})
export class UserTestModule {

}