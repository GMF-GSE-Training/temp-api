import { PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

async function main() {
    await seedDatabase(prisma);
}

async function seedDatabase(prismaService: PrismaClient) {
    const superAdminHashedPassword = await bcrypt.hash('super admin', 10);
    const supervisorHashedPassword = await bcrypt.hash('supervisor', 10);
    const lcuHashedPassword = await bcrypt.hash('lcu', 10);
    const userHashedPassword = await bcrypt.hash('user', 10);

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

    const roles = await prismaService.role.findMany();
    const superAdminRole = roles.find(r => r.role === 'super admin');
    const supervisorRole = roles.find(r => r.role === 'supervisor');
    const lcuRole = roles.find(r => r.role === 'lcu');
    const userRole = roles.find(r => r.role === 'user');

    if (!superAdminRole || !supervisorRole || !lcuRole || !userRole) {
        console.log('One or more roles do not exist');
        return;
    }

    const dinasList = ['T1', 'T2', 'T3', 'T4', 'T5'];

    const simA = fs.readFileSync(path.join(__dirname, '..', 'assets', 'image', 'SIM_A.png'));
    const simB = fs.readFileSync(path.join(__dirname, '..', 'assets', 'image', 'SIM_B.jpg'));
    const ktp = fs.readFileSync(path.join(__dirname, '..', 'assets', 'image', 'ktp.png'));
    const foto = fs.readFileSync(path.join(__dirname, '..', 'assets', 'image', 'foto.png'));
    const suratSehatButaWarna = fs.readFileSync(path.join(__dirname, '..', 'assets', 'image', 'surat_ket_sehat.png'));
    const suratBebasNarkoba = fs.readFileSync(path.join(__dirname, '..', 'assets', 'image', 'suratBebasNarkoba.png'));
    const qrCodeBase64 = await QRCode.toDataURL('http://localhost:4200/participant/view');
    const qrCode = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ''), 'base64');

    for (let i = 1; i <= 15; i++) {
        const email = `participant${i}@example.com`;
        const existingParticipant = await prismaService.participant.findFirst({
            where: { email },
        });
        const dinas = dinasList[i % 5];

        if(!existingParticipant) {
            await prismaService.participant.create({
                data: {
                noPegawai: `P${i.toString().padStart(3, '0')}`,
                nama: `Participant ${i}`,
                nik: `NIK${i.toString().padStart(4, '0')}`,
                dinas: dinas,
                bidang: `Bidang ${i}`,
                perusahaan: i % 2 === 0 ? `Perusahaan ${i}` : null,
                email: `participant${i}@example.com`,
                noTelp: `0812345678${i.toString().padStart(2, '0')}`,
                negara: `Negara ${i}`,
                tempatLahir: `Tempat Lahir ${i}`,
                tanggalLahir: new Date(1990, i % 12, i),
                simA,
                simB,
                ktp,
                foto,
                suratSehatButaWarna,
                tglKeluarSuratSehatButaWarna: new Date(2025, 11, 31),
                suratBebasNarkoba,
                tglKeluarSuratBebasNarkoba: new Date(2025, 11, 31),
                gmfNonGmf: i % 2 === 0 ? 'GMF' : 'Non GMF',
                qrCode,
                },
            });
            console.log(`Participant ${i} created successfully.`);
        }
    }


    // Seed 5 super admins
    for (let i = 1; i <= 5; i++) {
        const email = `superadmin${i}@example.com`;
        const existingUser = await prismaService.user.findFirst({
            where: { email },
        });

        if (!existingUser) {
            await prismaService.user.create({
                data: {
                    noPegawai: `SA${i.toString().padStart(3, '0')}`,
                    email,
                    name: `Super Admin ${i}`,
                    password: superAdminHashedPassword,
                    roleId: superAdminRole.id,
                },
            });
            console.log(`Super Admin ${i} created successfully.`);
        }
    }

    // Seed 5 supervisors
    for (let i = 1; i <= 5; i++) {
        const email = `supervisor${i}@example.com`;
        const existingUser = await prismaService.user.findFirst({
            where: { email },
        });

        if (!existingUser) {
            await prismaService.user.create({
                data: {
                    noPegawai: `SP${i.toString().padStart(3, '0')}`,
                    email,
                    name: `Supervisor ${i}`,
                    password: supervisorHashedPassword,
                    roleId: supervisorRole.id,
                },
            });
            console.log(`Supervisor ${i} created successfully.`);
        }
    }

    // Seed 5 LCUs
    for (let i = 1; i <= 5; i++) {
        const email = `lcu${i}@example.com`;
        const existingUser = await prismaService.user.findFirst({
            where: { email },
        });

        if (!existingUser) {
            await prismaService.user.create({
                data: {
                    noPegawai: `LCU${i.toString().padStart(3, '0')}`,
                    email,
                    name: `LCU ${i}`,
                    password: lcuHashedPassword,
                    roleId: lcuRole.id,
                },
            });
            console.log(`LCU ${i} created successfully.`);
        }
    }

    // Seed 5 Usrs
    for (let i = 1; i <= 15; i++) {
        const dinas = dinasList[i % 5];
        const email = `participant${i}@example.com`;
        const existingUser = await prismaService.user.findFirst({
            where: { email },
        });

        if (!existingUser) {
            await prismaService.user.create({
                data: {
                    noPegawai: `User${i.toString().padStart(3, '0')}`,
                    nik: `NIK${i.toString().padStart(4, '0')}`,
                    email,
                    name: `Participant ${i}`,
                    password: userHashedPassword,
                    dinas,
                    roleId: userRole.id,
                },
            });
            console.log(`User ${i} created successfully.`);
        }
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
