import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MailerModule } from "src/mailer/mailer.module";
import { ParticipantModule } from "src/participant/participant.module";
import { SharedModule } from "src/shared/shared.module";

@Module({
    imports: [
        MailerModule,
        ParticipantModule,
        SharedModule,
    ],
    providers: [
        AuthService,
    ],
    controllers: [AuthController],
})
export class AuthModule {}
