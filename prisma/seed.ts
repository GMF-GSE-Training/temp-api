import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../src/common/service/prisma.service';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from 'src/config/constants';

@Injectable()
export class AppService implements OnModuleInit {
    constructor(
        private prismaService: PrismaService,
    ) {}

    async onModuleInit() {
        await this.seedDatabase();
    }

    async seedDatabase() {
        const superAdminNoPegawai = jwtConstants.super_admin_no_pegawai;
        const superAdminEmail = jwtConstants.super_admin_email;
        const superAdminName = jwtConstants.super_admin_name;
        const superAdminPassword = jwtConstants.super_admin_password;

        const superAdminHashedPassword = await bcrypt.hash(superAdminPassword, 10);

        // Check if roles already exist
        const existingRoles = await this.prismaService.role.findMany({
            where: {
                role: { in: ['super admin', 'supervisor', 'lcu', 'user'] },
            }
        });

        // If roles don't exist, create them
        if (existingRoles.length === 0) {
            await this.prismaService.role.createMany({
                data: [
                    { role: 'super admin' },
                    { role: 'supervisor' },
                    { role: 'lcu' },
                    { role: 'user' },
                ]
            });
        }

        // Check if super admin role exists
        const superAdminRole = await this.prismaService.role.findFirst({
            where: {
                role: 'super admin',
            }
        });

        if (!superAdminRole) {
            console.log('Super admin role does not exist');
            return;
        }

        // Check if super admin user already exists
        const existingUser = await this.prismaService.user.findFirst({
            where: { email: superAdminEmail },
        });

        if (!existingUser) {
            await this.prismaService.user.create({
                data: {
                    no_pegawai: superAdminNoPegawai,
                    email: superAdminEmail,
                    name: superAdminName,
                    password: superAdminHashedPassword,
                    roleId: superAdminRole.id,
                }
            });

            console.log('Super admin user created successfully.');
        } else {
            console.log('Super admin user already exists.');
        }
    }
}
