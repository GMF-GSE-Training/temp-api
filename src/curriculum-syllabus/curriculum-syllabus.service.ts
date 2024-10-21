import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CreateCurriculumSyllabus, UpdateCurriculumSyllabus } from "src/model/curriculum-syllabus.model";
import { ActionAccessRights, ListRequest, Paging } from "src/model/web.model";
import { CurriculumSyllabusValidation } from "./curriculum-syllabus.validation";

@Injectable()
export class CurriculumSyllabusService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService, // jika diperlukan
    ) { }

    async createCurriculumSyllabus(request: CreateCurriculumSyllabus): Promise<string> {
        const curriculumSyllabusRequest = this.validationService.validate(CurriculumSyllabusValidation.CREATE, request);
        const { curriculumSyllabus } = curriculumSyllabusRequest;

        await this.prismaService.curriculumSyllabus.createMany({
            data: curriculumSyllabus.map((curriculumSyllabus) => ({
                capabilityId: curriculumSyllabus.capabilityId,
                nama: curriculumSyllabus.nama,
                durasiTeori: curriculumSyllabus.durasiTeori,
                durasiPraktek: curriculumSyllabus.durasiPraktek,
                type: curriculumSyllabus.type,
            })) 
        });

        const capabilityId = curriculumSyllabus[0].capabilityId;

        // Menghitung total durasiTeori dari semua item di curriculumSyllabus
        const totalDurasiTeoriRegGse = curriculumSyllabus
            .filter(item => item.type.toLocaleLowerCase() === 'regulasi gse')
            .reduce((total, item) => {
            return total + item.durasiTeori;
        }, 0);

        // Menghitung total durasiPraktek dari semua item di curriculumSyllabus
        const totalDurasiPraktekRegGse = curriculumSyllabus
            .filter(item => item.type.toLocaleLowerCase() === 'regulasi gse')
            .reduce((total, item) => {
            return total + item.durasiPraktek;
        }, 0);

        // Menghitung total durasiPraktek dari semua item di curriculumSyllabus
        const totalDurasiTeoriKompetensi = curriculumSyllabus
            .filter(item => item.type.toLocaleLowerCase() === 'kompetensi')
            .reduce((total, item) => {
            return total + item.durasiTeori;
        }, 0);

        // Menghitung total durasiPraktek dari semua item di curriculumSyllabus
        const totalDurasiPraktekKompetensi = curriculumSyllabus
            .filter(item => item.type.toLocaleLowerCase() === 'kompetensi')
            .reduce((total, item) => {
            return total + item.durasiPraktek;
        }, 0);

        const totalDurasi = totalDurasiTeoriRegGse + totalDurasiPraktekRegGse + totalDurasiTeoriKompetensi + totalDurasiPraktekKompetensi;

        await this.prismaService.capability.update({
            where: {
                id: capabilityId
            },
            data: {
                totalDurasiTeoriRegGse: totalDurasiTeoriRegGse,
                totalDurasiPraktekRegGse: totalDurasiPraktekRegGse,
                totalDurasiTeoriKompetensi: totalDurasiTeoriKompetensi,
                totalDurasiPraktekKompetensi: totalDurasiPraktekKompetensi,
                totalDurasi: totalDurasi,
            }
        });

        return "Berhasil membuat Curriculum & Syllabus";
    }

    async updateCurriculumSyllabus(capabilityId: string, request: UpdateCurriculumSyllabus): Promise<string> {
        const updateCurriculumSyllabusRequest = this.validationService.validate(CurriculumSyllabusValidation.UPDATE, request);

        const capability = await this.prismaService.capability.findUnique({
            where: {
                id: capabilityId,
            }
        });

        if(!capability) {
            throw new HttpException('Capability tidak ditemukan', 404);
        }

        const { curriculumSyllabus } = updateCurriculumSyllabusRequest;

         // Dapatkan semua data yang ada di database untuk capabilityId ini
        const existingSyllabus = await this.prismaService.curriculumSyllabus.findMany({
            where: { capabilityId }
        });

        // Simpan semua ID yang ada dalam request
        const requestIds = curriculumSyllabus.map(item => item.id);

        // Hapus data di database yang tidak ada di request
        const idsToDelete = existingSyllabus
            .filter(item => !requestIds.includes(item.id))  // Cari data yang tidak ada di request
            .map(item => item.id);

        await this.prismaService.curriculumSyllabus.deleteMany({
            where: { id: { in: idsToDelete } }
        });

        // Perbarui atau buat data baru
        for (const syllabus of curriculumSyllabus) {
            if (syllabus.id) {
            // Jika data ada (id tidak null), lakukan update
            await this.prismaService.curriculumSyllabus.update({
                where: {
                id: syllabus.id,
                },
                data: {
                capabilityId,
                nama: syllabus.nama,
                durasiTeori: syllabus.durasiTeori,
                durasiPraktek: syllabus.durasiPraktek,
                type: syllabus.type,
                },
            });
            } else {
            // Jika id tidak ada, buat data baru
            await this.prismaService.curriculumSyllabus.create({
                data: {
                capabilityId,
                nama: syllabus.nama,
                durasiTeori: syllabus.durasiTeori,
                durasiPraktek: syllabus.durasiPraktek,
                type: syllabus.type,
                },
            });
            }
        }

        // Hitung total durasi dan perbarui capability
        const totalDurasiTeoriRegGse = curriculumSyllabus
            .filter(item => item.type.toLowerCase() === 'regulasi gse')
            .reduce((total, item) => total + item.durasiTeori, 0);

        const totalDurasiPraktekRegGse = curriculumSyllabus
            .filter(item => item.type.toLowerCase() === 'regulasi gse')
            .reduce((total, item) => total + item.durasiPraktek, 0);

        const totalDurasiTeoriKompetensi = curriculumSyllabus
            .filter(item => item.type.toLowerCase() === 'kompetensi')
            .reduce((total, item) => total + item.durasiTeori, 0);

        const totalDurasiPraktekKompetensi = curriculumSyllabus
            .filter(item => item.type.toLowerCase() === 'kompetensi')
            .reduce((total, item) => total + item.durasiPraktek, 0);

        const totalDurasi = totalDurasiTeoriRegGse + totalDurasiPraktekRegGse + totalDurasiTeoriKompetensi + totalDurasiPraktekKompetensi;

        // Update Capability dengan total durasi
        await this.prismaService.capability.update({
            where: { id: capability.id },
            data: {
            totalDurasiTeoriRegGse,
            totalDurasiPraktekRegGse,
            totalDurasiTeoriKompetensi,
            totalDurasiPraktekKompetensi,
            totalDurasi,
            },
        });

        return "Curriculum & Syllabus berhasil diperbarui";
    }
}
