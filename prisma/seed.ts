import { PrismaClient } from "@prisma/client";
import { jwtConstants } from "../src/config/constants";
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    await seedDatabase(prisma);
}

async function seedDatabase(prismaService: PrismaClient) {
    const superAdminNoPegawai = jwtConstants.super_admin_no_pegawai;
    const superAdminEmail = jwtConstants.super_admin_email;
    const superAdminName = jwtConstants.super_admin_name;
    const superAdminPassword = jwtConstants.super_admin_password;

        const superAdminHashedPassword = await bcrypt.hash(superAdminPassword, 10);

        const existingRoles = await prismaService.role.findMany({
        where: {
            role: { in: ['super admin', 'supervisor', 'lcu', 'user'] },
        },
        });

        if (existingRoles.length === 0) {
        await prismaService.role.createMany({
            data: [
            { role: 'super admin' },
            { role: 'supervisor' },
            { role: 'lcu' },
            { role: 'user' },
            ],
        });
        }

        const superAdminRole = await prismaService.role.findFirst({
        where: {
            role: 'super admin',
        },
        });

        if (!superAdminRole) {
        console.log('Super admin role does not exist');
        return;
        }

        const existingUser = await prismaService.user.findFirst({
        where: { email: superAdminEmail },
        });

        if (!existingUser) {
        await prismaService.user.create({
            data: {
            no_pegawai: superAdminNoPegawai,
            email: superAdminEmail,
            name: superAdminName,
            password: superAdminHashedPassword,
            roleId: superAdminRole.id,
            },
        });

        console.log('Super admin user created successfully.');
        } else {
        console.log('Super admin user already exists.');
        }
}

main()
    .catch(e => {
    console.error(e);
    process.exit(1);
    })
    .finally(async () => {
    await prisma.$disconnect();
    });