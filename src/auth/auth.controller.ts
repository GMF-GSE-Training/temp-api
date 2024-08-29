import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { UpdateUserRequest } from "../model/user.model";
import { AuthResponse, CurrentUserRequest, LoginUserRequest } from "../model/auth.model";
import { buildResponse, WebResponse } from "../model/web.model";
import { AuthService } from "./auth.service";
import { Response } from "express";

@Controller('/auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/register')
    @HttpCode(200)
    async register(@Body() req: any): Promise<WebResponse<AuthResponse>> {
        const result = await this.authService.register(req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Post('/login')
    @HttpCode(200)
    async login(@Body() req: LoginUserRequest): Promise<WebResponse<AuthResponse>> {
        const result = await this.authService.login(req);
        return buildResponse(HttpStatus.OK, result);
    }

    @UseGuards(AuthGuard)
    @Get('/current')
    @HttpCode(200)
    async me(@Req() req: CurrentUserRequest): Promise<WebResponse<AuthResponse>> {
        const result = await this.authService.me(req.user);
        return buildResponse(HttpStatus.OK, result);
    }

    @UseGuards(AuthGuard)
    @Patch('/current')
    @HttpCode(200)
    async update(@Req() userCurrent: CurrentUserRequest, @Body() req: UpdateUserRequest): Promise<WebResponse<AuthResponse>> {
        const result = await this.authService.updateCurrent(userCurrent.user, req);
        return buildResponse(HttpStatus.OK, result);
    }

    @UseGuards(AuthGuard)
    @Delete('/current')
    @HttpCode(200)
    async logout(@Req() req: CurrentUserRequest): Promise<WebResponse<boolean>> {
        await this.authService.logout(req.user);
        return buildResponse(HttpStatus.OK, true);
    }
}