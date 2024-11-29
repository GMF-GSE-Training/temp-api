import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MailerModule } from "src/mailer/mailer.module";

@Module({
    imports: [
        MailerModule,
    ],
    providers: [
        AuthService,
    ],
    controllers: [AuthController],
})
export class AuthModule {}
