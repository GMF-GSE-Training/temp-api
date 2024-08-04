import { Body, Controller, Get, HttpCode, Post, Req } from "@nestjs/common";
import { UserService } from "./user.service";
import { WebResponse } from "src/model/web.model";
import { LoginUserRequest, RegisterUserRequest, UserResponse } from "../model/user.model";
import { User } from "@prisma/client";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/auth.guard";
import { AuthenticatedRequest } from "src/common/authRequest.interface";

@Controller("/users")
export class UserController {
    constructor(private userService: UserService) {}

    @Post()
    @HttpCode(200)
    async register(@Body() req: RegisterUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(req);
        return{
            data: result,
        }
    }

    @Post('/login')
    @HttpCode(200)
    async login(@Body() req: LoginUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.login(req);
        return{
            data: result,
        }
    }

    @UseGuards(AuthGuard)
    @Get('/current')
    @HttpCode(200)
    async get(@Req() req: AuthenticatedRequest): Promise<WebResponse<UserResponse>> {
        const user = req.user;
        return {
            data: {
                id: user.id,
                no_pegawai: user.no_pegawai,
                nik: user.nik,
                email: user.email,
                name: user.name,
                dinasId: user.dinasId,
                roleId: user.roleId,
                token: req.headers.authorization.split(' ')[1]
            }
        };
    }
}