import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { UpdateUserRequest } from "../model/user.model";
import { AuthResponse, CurrentUserRequest, LoginUserRequest } from "../model/auth.model";
import { buildResponse, WebResponse } from "../model/web.model";
import { AuthService } from "./auth.service";
import { Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/common/service/prisma.service";
import { ConfigService } from "@nestjs/config";

@Controller('/auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    @Post('/register')
    @HttpCode(200)
    async register(@Body() req: any): Promise<WebResponse<AuthResponse>> {
        const result = await this.authService.register(req);
        const { token, ...response } = result;
        return buildResponse(HttpStatus.OK, response);
    }

    @Get('/verify-email')
    async verifyEmail(@Query('token') token: string, @Query('callback') callbackUrl: string, @Res() res: Response): Promise<any> {
        try {
            const payload = this.jwtService.verify(token);
            console.log(payload)
            await this.prismaService.user.update({
                where: { id: payload.sub },
                data: { 
                    emailVerified: true,
                },
            });

            res.cookie('access_token', token, {
                httpOnly: true,
                secure: this.configService.get<string>('NODE_ENV') === 'production',
                // domain: this.configService.get<string>('HOST'),
                sameSite: 'lax',
                path: '/',
                maxAge: 1000 * 60 * 60 * 24,
            });

            const redirectUrl = callbackUrl || this.configService.get<string>('FRONTEND_URL');

            return res.redirect(redirectUrl);
        } catch (error) {
            throw new HttpException('Token tidak valid atau telah kadaluarsa', 400);
        }
    }

    @Post('/login')
    @HttpCode(200)
    async login(@Body() req: LoginUserRequest, @Res({ passthrough: true }) res: Response): Promise<WebResponse<AuthResponse>> {
        let result = await this.authService.login(req);
        res.cookie('access_token', result.token, {
            httpOnly: true,
            secure: this.configService.get<string>('NODE_ENV') === 'production',
                // domain: this.configService.get<string>('HOST'),
            sameSite: 'lax',
            path: '/',
            maxAge: 1000 * 60 * 60 * 24,
        });
        const { token, ...response } = result;
        return buildResponse(HttpStatus.OK, response);
    }

    @UseGuards(AuthGuard)
    @Get('/current')
    @HttpCode(200)
    async me(@Req() req: CurrentUserRequest): Promise<WebResponse<AuthResponse>> {
        const result = await this.authService.me(req.user);
        return buildResponse(HttpStatus.OK, result);
    }

    // @UseGuards(AuthGuard)
    // @Patch('/current')
    // @HttpCode(200)
    // async update(@Req() userCurrent: CurrentUserRequest, @Body() req: UpdateUserRequest): Promise<WebResponse<AuthResponse>> {
    //     const result = await this.authService.updateCurrent(userCurrent.user, req);
    //     return buildResponse(HttpStatus.OK, result);
    // }

    @Post('request-reset-password')
    async requestResetPassword(@Body('email') email: string) {
        return this.authService.requestPasswordReset(email);
    }

    @Get('verify-reset-password/:token')
    async verifyResetPassword(@Param('token') token: string, @Res() res: Response) {
        const isValid = await this.authService.verifyResetPasswordToken(token);
        if (isValid) {
        // Redirect ke frontend untuk memasukkan password baru
        res.redirect('http://192.168.1.12:4200/reset-password?token=' + token);
        } else {
        return res.status(400).json({ message: 'Token tidak valid atau sudah kadaluarsa' });
        }
    }

    @Post('reset-password')
    async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
        return this.authService.resetPassword(token, newPassword);
    }

    @UseGuards(AuthGuard)
    @Delete('/current')
    @HttpCode(200)
    async logout(@Req() req: CurrentUserRequest, @Res({ passthrough: true }) res: Response): Promise<WebResponse<boolean>> {
        await this.authService.logout(req.user);
        res.cookie('access_token', '', {
            httpOnly: true,
            // secure: this.configService.get<string>('NODE_ENV') === 'production', 
            secure: false,
            sameSite: 'none',
            expires: new Date(0) // or you can use maxAge: 0
        });
        return buildResponse(HttpStatus.OK, true);
    }
}