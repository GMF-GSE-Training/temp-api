import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../common/guard/auth.guard";
import { AuthResponse, CurrentUserRequest, LoginUserRequest, RegisterUserRequest, ResetPassword } from "../model/auth.model";
import { buildResponse, WebResponse } from "../model/web.model";
import { AuthService } from "./auth.service";
import { Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/common/service/prisma.service";
import { ConfigService } from "@nestjs/config";
import * as os from 'os';

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
    async register(@Body() req: RegisterUserRequest): Promise<WebResponse<string>> {
        const result = await this.authService.register(req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/verify-email')
    async verifyEmail(@Query('token') token: string, @Query('callback') callbackUrl: string, @Res() res: Response): Promise<void> {
        try {
            await this.authService.verifyEmail(token);

            // Dapatkan alamat IP lokal secara dinamis untuk tahap pengembangan
            const networkInterfaces = os.networkInterfaces();
            let localIp = 'localhost'; // Default fallback

            // Iterasi melalui antarmuka jaringan untuk menemukan alamat IPv4 pertama
            for (const interfaceName in networkInterfaces) {
                const addresses = networkInterfaces[interfaceName];
                if (addresses) {
                for (const addr of addresses) {
                    if (addr.family === 'IPv4' && !addr.internal) {
                    localIp = addr.address; // Tetapkan alamat IPv4 non-internal pertama
                    break;
                    }
                }
                }
            }

            res.cookie('access_token', token, {
                httpOnly: true,
                secure: this.configService.get<string>('NODE_ENV') === 'production',
                // domain: this.configService.get<string>('HOST'),
                sameSite: 'lax',
                path: '/',
                maxAge: 1000 * 60 * 60 * 24,
            });

            const redirectUrl = callbackUrl || `http://${localIp}:4200/home`;

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
        const result = await this.authService.me(req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Post('request-reset-password')
    async requestResetPassword(@Body('email') email: string): Promise<WebResponse<string>> {
        const result = await this.authService.requestPasswordReset(email);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('verify-reset-password/:token')
    async verifyResetPassword(@Param('token') token: string, @Res() res: Response): Promise<WebResponse<boolean>> {
        const isValid = await this.authService.verifyResetPasswordToken(token);
        if (isValid) {
            // Dapatkan alamat IP lokal secara dinamis untuk tahap pengembangan
            const networkInterfaces = os.networkInterfaces();
            let localIp = 'localhost'; // Default fallback
            
            // Iterasi melalui antarmuka jaringan untuk menemukan alamat IPv4 pertama
            for (const interfaceName in networkInterfaces) {
                const addresses = networkInterfaces[interfaceName];
                if (addresses) {
                for (const addr of addresses) {
                    if (addr.family === 'IPv4' && !addr.internal) {
                    localIp = addr.address; // Tetapkan alamat IPv4 non-internal pertama
                    break;
                    }
                }
                }
            }

            // Redirect ke frontend untuk memasukkan password baru
            res.redirect(`http://${localIp}:4200}/reset/${token}`);
            return buildResponse(HttpStatus.OK, isValid);
        } else {
            throw new HttpException('Token tidak valid atau sudah kadaluarsa', 400);
        }
    }

    @Post('reset-password')
    async resetPassword(@Body() req: ResetPassword): Promise<WebResponse<boolean>> {
        await this.authService.resetPassword(req);
        return buildResponse(HttpStatus.OK, true);
    }

    @UseGuards(AuthGuard)
    @Delete('/current')
    @HttpCode(200)
    async logout(@Req() req: CurrentUserRequest, @Res({ passthrough: true }) res: Response): Promise<WebResponse<string>> {
        const result = await this.authService.logout(req);
        res.cookie('access_token', '', {
            httpOnly: true,
            // secure: this.configService.get<string>('NODE_ENV') === 'production', 
            secure: false,
            sameSite: 'none',
            expires: new Date(0) // or you can use maxAge: 0
        });
        return buildResponse(HttpStatus.OK, result);
    }
}