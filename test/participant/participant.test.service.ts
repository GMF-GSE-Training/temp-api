import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../src/common/service/prisma.service";
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ParticipantTestService {
    constructor(private prismaService: PrismaService) {}

    async delete() {
        await this.prismaService.participant.deleteMany();
    }

    async create() {
        const files = {
            sim_a: await this.getTestFilePath('SIM A.png'),
            sim_b: await this.getTestFilePath('SIM B.jpg'),
            ktp: await this.getTestFilePath('KTP.png'),
            foto: await this.getTestFilePath('foto.png'),
            surat_sehat_buta_warna: await this.getTestFilePath('surat_ket_sehat.png'),
            surat_bebas_narkoba: await this.getTestFilePath('surat_bebas_narkoba.png'),
        };

        await this.prismaService.participant.create({
            data: {
                no_pegawai: "test",
                nama: "test",
                nik: "test",
                dinas: "TA",
                bidang: "test",
                perusahaan: "test",
                email: "test@email.com",
                no_telp: "test",
                negara: "test",
                tempat_lahir: "test",
                tanggal_lahir: new Date('2024-01-01'),
                sim_a: files.sim_a,
                sim_b: files.sim_b,
                ktp: files.ktp,
                foto: files.foto,
                surat_sehat_buta_warna: files.surat_sehat_buta_warna,
                exp_surat_sehat: new Date('2024-01-01'),
                surat_bebas_narkoba: files.surat_bebas_narkoba,
                exp_bebas_narkoba: new Date('2024-01-01'),
                gmf_non_gmf: "test",
                link_qr_code: "www.google.com",
            }
        });
    }

    async createOtherParticipant() {
        const files = {
            sim_a: await this.getTestFilePath('SIM A.png'),
            sim_b: await this.getTestFilePath('SIM B.jpg'),
            ktp: await this.getTestFilePath('KTP.png'),
            foto: await this.getTestFilePath('foto.png'),
            surat_sehat_buta_warna: await this.getTestFilePath('surat_ket_sehat.png'),
            surat_bebas_narkoba: await this.getTestFilePath('surat_bebas_narkoba.png'),
        };

        await this.prismaService.participant.create({
            data: {
                no_pegawai: "test2",
                nama: "test2",
                nik: "test2",
                dinas: "TC",
                bidang: "test2",
                perusahaan: "test2",
                email: "test2@email.com",
                no_telp: "test2",
                negara: "test2",
                tempat_lahir: "test2",
                tanggal_lahir: new Date('2024-01-01'),
                sim_a: files.sim_a,
                sim_b: files.sim_b,
                ktp: files.ktp,
                foto: files.foto,
                surat_sehat_buta_warna: files.surat_sehat_buta_warna,
                exp_surat_sehat: new Date('2024-01-01'),
                surat_bebas_narkoba: files.surat_bebas_narkoba,
                exp_bebas_narkoba: new Date('2024-01-01'),
                gmf_non_gmf: "test2",
                link_qr_code: "www.google.com",
            }
        });
    }

    private async getTestFilePath(fileName: string): Promise<string> {
        const filePath = path.resolve(__dirname, 'image', fileName);
        try {
            await fs.access(filePath);
            return filePath;
        } catch (error) {
            throw new Error(`Test file not found: ${filePath}`);
        }
    }
}
