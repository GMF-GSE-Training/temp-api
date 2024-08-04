import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../config/constants';

@Module({
    imports: [
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [UserService],
    controllers: [UserController,],
})
export class UserModule {

}