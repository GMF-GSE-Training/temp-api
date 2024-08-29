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
        const token = this.extractTokenFromHeader(request);

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

    private extractTokenFromHeader(request: Request): string | undefined {
        const authorization = request.headers.authorization;
        if (!authorization) return undefined;
        const [type, token] = authorization.split(' ');
        return type === 'Bearer' ? token : undefined;
    }    
}
