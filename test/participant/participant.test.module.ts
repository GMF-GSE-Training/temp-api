import { Module } from "@nestjs/common";
import { UserTestService } from "../user/user.test.service";
import { ParticipantTestService } from "./participant.test.service";


@Module({
    providers: [
        UserTestService,
        ParticipantTestService,
    ],
})
export class ParticipantTestModule {

}