import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../service/prisma.service';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prismaService: PrismaService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!requiredRoles) {
            return true;
        }

        const normalizedRequiredRoles = requiredRoles.map(role => role.toLowerCase());

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        console.log('User in RoleGuard:', user);

        if (!user) {
            throw new HttpException('Unauthorized', 401);
        }

        const userWithRole = await this.prismaService.user.findUnique({
            where: { id: user.id },
            include: { role: true }
        });

        if (!userWithRole || !userWithRole.role) {
            throw new HttpException('Forbidden', 403);
        }

        const userRoleName = userWithRole.role.role.toLowerCase();
        const hasRole = normalizedRequiredRoles.includes(userRoleName);
        console.log('User role:', userRoleName, 'Required roles:', normalizedRequiredRoles);

        if (!hasRole) {
            throw new HttpException('Forbidden', 403);
        }

        return true;
    }
}
