import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CreateCurriculumSyllabus } from "src/model/curriculum-syllabus.model";

@Injectable()
export class CurriculumSyllabusService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService, // jika diperlukan
    ) { }

    async createCurriculumSyllabus(request: CreateCurriculumSyllabus): Promise<any> {
        const { capabilityId, total_durasi, regulasiGSEs, kompetensis } = request;
    
        // Buat kurikulum terlebih dahulu
        const curriculumSyllabus = await this.prismaService.curriculumSyllabus.create({
            data: {
            capabilityId,
            total_durasi,
            },
        });
    
        // Proses regulasiGSEs: cek apakah regulasi sudah ada, jika tidak, buat baru
        for (const regulasi of regulasiGSEs) {
            let regulasiGSE = await this.prismaService.regulasiGSE.findFirst({
            where: { reg_gse: regulasi.regulasiGSEId }, // asumsikan regulasiGSEId = reg_gse
            });
    
            if (!regulasiGSE) {
            // Jika regulasi belum ada, buat baru
            regulasiGSE = await this.prismaService.regulasiGSE.create({
                data: { reg_gse: regulasi.regulasiGSEId },
            });
            }
    
            // Buat relasi ke tabel pivot RegulasiGSECurriculumSyllabus
            await this.prismaService.regulasiGSECurriculumSyllabus.create({
            data: {
                regulasiGSEId: regulasiGSE.id,
                curriculumId: curriculumSyllabus.id,
                durasi_teori: regulasi.durasi_teori,
                durasi_praktek: regulasi.durasi_praktek,
            },
            });
        }
    
        // Proses kompetensis: cek apakah kompetensi sudah ada, jika tidak, buat baru
        for (const kompetensi of kompetensis) {
            let existingKompetensi = await this.prismaService.kompetensi.findFirst({
            where: { kompetensi: kompetensi.kompetensiId }, // asumsikan kompetensiId = kompetensi
            });
    
            if (!existingKompetensi) {
            // Jika kompetensi belum ada, buat baru
            existingKompetensi = await this.prismaService.kompetensi.create({
                data: { kompetensi: kompetensi.kompetensiId },
            });
            }
    
            // Buat relasi ke tabel pivot KompetensiCurriculumSyllabus
            await this.prismaService.kompetensiCurriculumSyllabus.create({
            data: {
                kompetensiId: existingKompetensi.id,
                curriculumId: curriculumSyllabus.id,
                durasi_teori: kompetensi.durasi_teori,
                durasi_praktek: kompetensi.durasi_praktek,
            },
            });
        }
    
        // Kembalikan hasil dari kurikulum yang dibuat
        return curriculumSyllabus;
    }
}
