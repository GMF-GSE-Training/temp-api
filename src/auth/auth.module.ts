import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MailerModule } from "src/mailer/mailer.module";
import { ParticipantModule } from "src/participant/participant.module";

@Module({
    imports: [
        MailerModule,
        ParticipantModule,
    ],
    providers: [
        AuthService,
    ],
    controllers: [AuthController],
})
export class AuthModule {}
