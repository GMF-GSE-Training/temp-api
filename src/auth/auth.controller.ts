import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { CurrentUserRequest, LoginUserRequest, UpdateUserRequest, UserResponse } from "src/model/user.model";
import { WebResponse } from "src/model/web.model";
import { AuthService } from "./auth.service";

@Controller('/auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    
    @Post('/login')
    @HttpCode(200)
    async login(@Body() req: LoginUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.authService.login(req);
        return{
            data: result,
        }
    }

    @UseGuards(AuthGuard)
    @Get('/current')
    @HttpCode(200)
    async me(@Req() req: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
        const user = req.user;
        const result = await this.authService.me(user);
        return {
            data: result,
        };
    }

    @UseGuards(AuthGuard)
    @Patch('/current')
    @HttpCode(200)
    async updateMe(@Req() userCurrent: CurrentUserRequest, @Body() req: UpdateUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.authService.updateMe(userCurrent.user, req);
        return {
            data: result,
        };
    }

    @UseGuards(AuthGuard)
    @Delete('/current')
    @HttpCode(200)
    async logout(@Req() req: CurrentUserRequest): Promise<WebResponse<boolean>> {
        await this.authService.logout(req.user);
        return {
            data: true,
        };
    }
}