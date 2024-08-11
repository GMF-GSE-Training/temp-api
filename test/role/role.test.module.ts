import { Module } from "@nestjs/common";
import { UserTestService } from "../user/user.test.service";
import { RoleTestService } from "./role.test.service";

@Module({
    providers: [
        UserTestService,
        RoleTestService
    ],
})
export class RoleTestModule {

}