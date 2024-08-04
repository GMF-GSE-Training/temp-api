import { Module } from "@nestjs/common";
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../config/constants';
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "../common/guard/auth.guard";

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [
        AuthService,
        AuthGuard,
    ],
    controllers: [AuthController],
})
export class AuthModule {}
