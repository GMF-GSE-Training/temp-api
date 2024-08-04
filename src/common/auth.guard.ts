import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from "../config/constants";
import { Request } from 'express';
import { PrismaService } from "./prisma.service";
import { AuthenticatedRequest } from './authRequest.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prismaService: PrismaService,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new HttpException('Unauthorized', 401);
        }

        try {
            const payload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: jwtConstants.secret
                }
            );
            const user = await this.prismaService.user.findUnique({
                where: { id: payload.sub }
            });

            if (!user) {
                throw new HttpException('Unauthorized', 401);
            }

            request['user'] = user;
        } catch {
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