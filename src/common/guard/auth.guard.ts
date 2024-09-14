import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from "../../config/constants";
import { Request } from 'express';
import { PrismaService } from "../service/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prismaService: PrismaService,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const referer = request.headers.referer || request.headers.origin;
        if (!this.isValidReferer(referer)) {
            throw new HttpException('Akses terlarang', 403);
        }

        const token = this.extractTokenFromCookie(request);

        if (!token) {
            throw new HttpException('Unauthorized', 401);
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                { secret: jwtConstants.access_token }
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
            process.env.ORIGIN, // url aplikasi front-end
        ];

        if (!referer) {
            return false; // Jika referer tidak ada, tolak akses
        }

        // Periksa apakah referer atau origin ada dalam daftar yang diizinkan
        return allowedOrigins.some(origin => referer.startsWith(origin));
    }
}
