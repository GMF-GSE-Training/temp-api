import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CapabilityResponse } from "src/model/capability.model";
import { CreateCurriculumSyllabus } from "src/model/curriculum-syllabus.model";
import { ActionAccessRights, ListRequest, Paging } from "src/model/web.model";

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
                where: { reg_gse: regulasi.reg_gse }, // asumsikan reg_gse = reg_gse
            });
    
            if (!regulasiGSE) {
                // Jika regulasi belum ada, buat baru
                regulasiGSE = await this.prismaService.regulasiGSE.create({
                    data: { reg_gse: regulasi.reg_gse },
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
                where: { kompetensi: kompetensi.kompetensi }, // asumsikan kompetensi = kompetensi
            });
    
            if (!existingKompetensi) {
                // Jika kompetensi belum ada, buat baru
                existingKompetensi = await this.prismaService.kompetensi.create({
                    data: { kompetensi: kompetensi.kompetensi },
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

    async getCurriculumSyllabus(curriculumSyllabusId: string): Promise<any> {
        const curriculumSyllabus = await this.prismaService.curriculumSyllabus.findUnique({
            where: {
                id: curriculumSyllabusId,
            }
        });

        if(!curriculumSyllabus) {
            throw new HttpException('Curriculum & Syllabus Not Found', 404);
        }

        const result = await this.prismaService.curriculumSyllabus.findMany({
            include: {
                capability: true,
                regulasiGSEs: {
                    include: {
                        regulasiGSE: true,
                    },
                },
                kompetensis: {
                    include: {
                        kompetensi: true,
                    },
                },
            },
        });

        return result;
    }

    async listCurriculumSyllabus(request: ListRequest): Promise<{ data: any[], actions: ActionAccessRights, paging: Paging }> {
        let curriculumSyllabus: any[];

        curriculumSyllabus = await this.prismaService.curriculumSyllabus.findMany({
            include: {
                capability: true,
                regulasiGSEs: {
                    include: {
                        regulasiGSE: true,
                    },
                },
                kompetensis: {
                    include: {
                        kompetensi: true,
                    },
                },
            },
        });

        const totalCurriculumSyllabus = curriculumSyllabus.length;
        const totalPage = Math.ceil(totalCurriculumSyllabus / request.size);
        const paginateCurriculumSyllabus = curriculumSyllabus.slice(
            (request.page - 1) * request.size,
            request.page * request.size
        );

        if (paginateCurriculumSyllabus.length === 0) {
            throw new HttpException("Data tidak ditemukan", 404);
        }

        return {
            data: paginateCurriculumSyllabus,
            actions:{
                canEdit: true,
                canDelete: true,
                canView: true,
            },
            paging: {
                current_page: request.page,
                total_page: totalPage,
                size: request.size,
            },
        };
    }
}
