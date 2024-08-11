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
        const controller = context.getClass().name;
        if(controller === 'UserController') {
            const requiredRoles = this.getRequiredRoles(context);

            const request = context.switchToHttp().getRequest();

            const userWithRole = await this.getUserWithRole(request);

            const userRole = userWithRole.role.role.toLowerCase();
            const hasRole = requiredRoles.map(role => role.toLowerCase()).includes(userRole);

            if (!hasRole) {
                throw new HttpException('Forbidden', 403);
            }

            const method = request.method;
            const requestedRoleId = request.body.roleId;
            const requestedDinasId = request.body.dinasId;

            if (method === 'POST') {
                if (!requestedRoleId) {
                    throw new HttpException('Validation Error', 400);
                }

                    const requestedRole = await this.prismaService.role.findUnique({
                        where: { 
                            id: requestedRoleId,
                        }
                    });

                if (!requestedRole) {
                    throw new HttpException('Invalid Role', 400);
                }

                const requestedRoleName = requestedRole.role.toLowerCase();

                if (userRole === 'supervisor') {
                    if (requestedRoleName === 'super admin' || !['supervisor', 'lcu', 'user'].includes(requestedRoleName)) {
                        throw new HttpException('Forbidden: Supervisors can only create Supervisor, LCU, or User accounts', 403);
                    }
                } else if (userRole === 'lcu') {
                    if (request.body.dinasId !== userWithRole.dinasId) {
                        throw new HttpException('Forbidden: LCU can only create User accounts within the same dinas', 403);
                    }
                }
            }

            if (method === 'PATCH') {
                const targetUserId = request.params.userId;
                const targetUser = await this.prismaService.user.findUnique({
                    where: { 
                        id: Number(targetUserId),
                    },
                    include: {
                        role: true,
                    }
                });

                if (!targetUser) {
                    throw new HttpException('User Not Found', 404);
                }

                const targetUserRole = targetUser.role.role.toLowerCase();

                // Jika target user adalah Supervisor atau Super Admin, LCU tidak boleh memperbarui data apapun
                if (userRole === 'lcu' && (targetUserRole === 'supervisor' || targetUserRole === 'super admin')) {
                    throw new HttpException('Forbidden: LCU cannot update data on Supervisor or Super Admin accounts', 403);
                }

                // Jika target user adalah Super Admin, Supervisor tidak boleh memperbarui data apapun
                if (userRole === 'supervisor' && targetUserRole === 'super admin') {
                    throw new HttpException('Forbidden: Supervisors cannot update data on Super Admin accounts', 403);
                }

                if (requestedRoleId) {
                    const requestedRole = await this.prismaService.role.findUnique({
                        where: { 
                            id: requestedRoleId,
                        }
                    });

                    const requestedRoleName = requestedRole.role.toLowerCase();

                    if (userRole === 'supervisor') {
                        if (requestedRoleName === 'super admin' || !['supervisor', 'lcu', 'user'].includes(requestedRoleName)) {
                            throw new HttpException('Forbidden: Supervisors can only update Supervisor, LCU, or User accounts', 403);
                        }
                    } else if (userRole === 'lcu') {
                        if(requestedRoleName !== 'user') {
                            throw new HttpException('Forbidden: LCU cannot update to any role other than User', 403);
                        }
                    }
                }

                if(requestedDinasId && userRole === 'lcu' && requestedDinasId !== userWithRole.dinasId) {
                    throw new HttpException('Forbidden: LCU can only update User accounts within the same dinas', 403);
                }
            }

            if (method === 'GET') {
                const requestedUserId = request.params.userId;
                if (!requestedUserId) {
                    throw new HttpException('User ID is required for GET requests', 400);
                }

                const requestedUser = await this.prismaService.user.findUnique({
                    where: { 
                        id: Number(requestedUserId),
                    },
                    include: {
                        role: true,
                    }
                });

                if (!requestedUser) {
                    throw new HttpException('User Not Found', 404);
                }

                const requestedRoleName = requestedUser.role.role.toLowerCase();

                if (userRole === 'supervisor') {
                    if (requestedRoleName === 'super admin') {
                        throw new HttpException('Forbidden: Supervisors cannot access Super Admin data', 403);
                    }
                } else if (userRole === 'lcu') {
                    if (requestedRoleName !== 'user' || requestedUser.dinasId !== userWithRole.dinasId) {
                        throw new HttpException('Forbidden: LCU can only access User data within the same dinas', 403);
                    }
                }
            }   

            return true;

        } else if(controller === 'RoleController') {
            return this.handleController(context);
        } else if(controller === 'DinasController') {
            return this.handleController(context);
        }
    }

    private async handleController(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.getRequiredRoles(context);
        const request = context.switchToHttp().getRequest();
        const user = await this.getUserWithRole(request);

        this.checkRoleAuthorization(user.role.role, requiredRoles);

        return true;
    }

    private getRequiredRoles(context: ExecutionContext): string[] {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!requiredRoles) {
            throw new HttpException('Forbidden', 403);
        }
        return requiredRoles;
    }

    private async getUserWithRole(request: any): Promise<any> {
        const user = request.user;

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

        return userWithRole;
    }

    private checkRoleAuthorization(userRole: string, requiredRoles: string[]): void {
        const hasRole = requiredRoles.map(role => role.toLowerCase()).includes(userRole.toLowerCase());

        if (!hasRole) {
            throw new HttpException('Forbidden', 403);
        }
    }
}
