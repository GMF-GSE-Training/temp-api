import { Module } from "@nestjs/common";
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../config/constants';
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "../common/guard/auth.guard";
import { PrismaService } from "src/common/service/prisma.service";

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.access_token,
            signOptions: { expiresIn: jwtConstants.access_token_expires_in },
        }),
    ],
    providers: [
        AuthService,
        AuthGuard,
        PrismaService
    ],
    controllers: [AuthController],
})
export class AuthModule {}
