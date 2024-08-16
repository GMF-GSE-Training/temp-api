import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { CurrentUserRequest, LoginUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { buildResponse, WebResponse } from "../model/web.model";
import { AuthService } from "./auth.service";

@Controller('/auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    
    @Post('/login')
    @HttpCode(200)
    async login(@Body() req: LoginUserRequest): Promise<WebResponse<UserResponse>> {
        try {
            const result = await this.authService.login(req);
            return buildResponse(HttpStatus.OK, result);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }

    @UseGuards(AuthGuard)
    @Get('/current')
    @HttpCode(200)
    async me(@Req() req: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
        try {
            const user = req.user;
            const result = await this.authService.me(user);
            return buildResponse(HttpStatus.OK, result);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }

    @UseGuards(AuthGuard)
    @Patch('/current')
    @HttpCode(200)
    async updateMe(@Req() userCurrent: CurrentUserRequest, @Body() req: UpdateUserRequest): Promise<WebResponse<UserResponse>> {
        try {
            const result = await this.authService.updateMe(userCurrent.user, req);
            return buildResponse(HttpStatus.OK, result);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }

    @UseGuards(AuthGuard)
    @Delete('/current')
    @HttpCode(200)
    async logout(@Req() req: CurrentUserRequest): Promise<WebResponse<boolean>> {
        try {
            await this.authService.logout(req.user);
            return buildResponse(HttpStatus.OK, true);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }
}