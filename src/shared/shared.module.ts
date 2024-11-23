import { Module } from "@nestjs/common";
import { CoreHelper } from "./helpers/core.helper";
import { UserHelper } from "./helpers/user.helper";
import { CoreUtil } from "./utils/core.utils";

@Module({
    providers: [
        CoreHelper,
        UserHelper,
        CoreUtil,
    ],
    exports: [
        CoreHelper,
        UserHelper,
        CoreUtil,
    ],
})
export class SharedModule {}
