import { CanActivate, ExecutionContext, HttpException, Inject, Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from "../../common/service/prisma.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private prismaService: PrismaService,
        private readonly configService: ConfigService,
        @Inject('ACCESS_JWT_SERVICE') private readonly accessJwtService: JwtService,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const referer = request.headers.referer || request.headers.origin;
        const accessToken = this.extractTokenFromCookie(request);
        
        if (!accessToken) {
            throw new HttpException('Unauthorized', 401);
        }
        
        if (this.isProduction() && !referer) {
            throw new HttpException('Forbidden', 403);
        }
        
        try {
            const verifyAccessToken = await this.accessJwtService.verifyAsync(accessToken);
            
            const user = await this.prismaService.user.findUnique({
                where: { id: verifyAccessToken.id },
                select: {
                    id: true,
                    participantId: true,
                    idNumber: true,
                    nik: true,
                    email: true,
                    name: true,
                    dinas: true,
                    refreshToken: true,
                    accountVerificationToken: true,
                    emailChangeToken: true,
                    passwordResetToken: true,
                    verifiedAccount: true,
                    role: true,
                }
            });
            
            if(!user) {
                throw new HttpException('Pengguna tidak ditemukan', 404);
            }
            
            if(!user.verifiedAccount) {
                throw new HttpException('Akun belum diverifikasi', 403);
            }
            
            request.user = user;
        } catch (error) {
            console.log(error)
            throw new HttpException('Unauthorized', 401);
        }
        return true;
    }

    private extractTokenFromCookie(request: Request): string | undefined {
        return request.cookies.access_token;
    }

    private isProduction(): boolean {
        return this.configService.get<string>('NODE_ENV') === 'production';
    }
}
