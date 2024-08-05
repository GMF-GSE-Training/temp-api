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

        if (!user) {
            throw new HttpException('Unauthorized', 401);
        }

        const userWithRole = await this.prismaService.user.findUnique({
            where: { 
                id: user.id, 
            },
            include: { 
                role: true, 
            }
        });

        if (!userWithRole || !userWithRole.role) {
            throw new HttpException('Forbidden', 403);
        }

        const userRole = userWithRole.role.role.toLowerCase();
        const hasRole = normalizedRequiredRoles.includes(userRole);

        if (!hasRole) {
            throw new HttpException('Forbidden', 403);
        }

        console.log(userWithRole);
        console.log(request.body);

        const requestedRoleId = request.body.roleId;

        if(!requestedRoleId) {
            throw new HttpException('Validation Error', 400);
        }

        const requestedRole = await this.prismaService.role.findUnique({
            where: { 
                id: requestedRoleId,
            }
        });

        const requestedRoleName = requestedRole.role.toLowerCase();
        console.log(requestedRoleName);

        if (userRole === 'supervisor') {
            if (requestedRoleName === 'super admin' || !['supervisor', 'lcu', 'user'].includes(requestedRoleName)) {
                throw new HttpException('Forbidden: Supervisors can only create Supervisor, LCU, or User accounts', 403);
            }
        } else if (userRole === 'lcu') {
            if (request.body.dinasId !== user.dinasId) {
                throw new HttpException('Forbidden: LCU can only create User accounts within the same dinas', 403);
            }
        }

        return true;
    }
}
