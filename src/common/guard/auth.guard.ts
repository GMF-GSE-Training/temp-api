import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from "../service/prisma.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prismaService: PrismaService,
        private readonly configService: ConfigService
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const referer = request.headers.referer || request.headers.origin;
        const token = this.extractTokenFromCookie(request);

        if (!token) {
            throw new HttpException('Unauthorized', 401);
        }

        // if (!this.isValidReferer(referer)) {
        //     throw new HttpException('Akses terlarang', 403);
        // }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                { secret: this.configService.get<string>('ACCESS_TOKEN') }
            );

            const user = await this.prismaService.user.findUnique({
                where: { id: payload.sub },
                select: {
                    id: true,
                    no_pegawai: true,
                    nik: true,
                    email: true,
                    name: true,
                    dinas: true,
                    roleId: true,
                    token: true,
                }
            });

            if (!user || user.token !== token) {
                throw new HttpException('Unauthorized', 401);
            }

            request.user = user;
        } catch (err) {
            throw new HttpException('Unauthorized', 401);
        }
        return true;
    }

    private extractTokenFromCookie(request: Request): string | undefined {
        return request.cookies.access_token;
    }

    private isValidReferer(referer: string | undefined): boolean {
        // Daftar referer yang valid (ganti sesuai environment)
        const allowedOrigins = [
            this.configService.get<string>('ORIGIN'), // url aplikasi front-end
        ];

        if (!referer) {
            return false; // Jika referer tidak ada, tolak akses
        }

        // Periksa apakah referer atau origin ada dalam daftar yang diizinkan
        return allowedOrigins.some(origin => referer.startsWith(origin));
    }
}
