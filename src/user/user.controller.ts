import { Body, Controller, Get, Header, HttpCode, Post, Req } from "@nestjs/common";
import { UserService } from "./user.service";
import { WebResponse } from "src/model/web.model";
import { LoginUserRequest, CurrentUserRequest, RegisterUserRequest, UserResponse } from "../model/user.model";
import { User } from "@prisma/client";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/auth.guard";

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
    async get(@Req() req: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
        const user = req['user'];
        const result = await this.userService.me(user.id);
        return {
            data: result,
        };
    }
}