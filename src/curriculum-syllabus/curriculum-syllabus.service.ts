import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CreateCurriculumSyllabus } from "src/model/curriculum-syllabus.model";
import { ActionAccessRights, ListRequest, Paging } from "src/model/web.model";

@Injectable()
export class CurriculumSyllabusService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService, // jika diperlukan
    ) { }

    async createCurriculumSyllabus(request: CreateCurriculumSyllabus): Promise<string> {
        console.log(request);
        const { curriculum_syllabus } = request;

        await this.prismaService.curriculumSyllabus.createMany({
            data: curriculum_syllabus.map((curriculum_syllabus) => ({
                capabilityId: curriculum_syllabus.capabilityId,
                nama: curriculum_syllabus.nama,
                durasi_teori: curriculum_syllabus.durasi_teori,
                durasi_praktek: curriculum_syllabus.durasi_praktek,
                type: curriculum_syllabus.type,
            })) 
        });

        const capabilityId = curriculum_syllabus[0].capabilityId;

        // Menghitung total durasi_teori dari semua item di curriculum_syllabus
        const totalDurasiTeoriRegGse = curriculum_syllabus
            .filter(item => item.type.toLocaleLowerCase() === 'regulasi gse')
            .reduce((total, item) => {
            return total + item.durasi_teori;
        }, 0);

        // Menghitung total durasi_praktek dari semua item di curriculum_syllabus
        const totalDurasiPraktekRegGse = curriculum_syllabus
            .filter(item => item.type.toLocaleLowerCase() === 'regulasi gse')
            .reduce((total, item) => {
            return total + item.durasi_praktek;
        }, 0);

        // Menghitung total durasi_praktek dari semua item di curriculum_syllabus
        const totalDurasiTeoriKompetensi = curriculum_syllabus
            .filter(item => item.type.toLocaleLowerCase() === 'kompetensi')
            .reduce((total, item) => {
            return total + item.durasi_teori;
        }, 0);

        console.log(totalDurasiTeoriKompetensi);

        // Menghitung total durasi_praktek dari semua item di curriculum_syllabus
        const totalDurasiPraktekKompetensi = curriculum_syllabus
            .filter(item => item.type.toLocaleLowerCase() === 'kompetensi')
            .reduce((total, item) => {
            return total + item.durasi_praktek;
        }, 0);

        console.log(totalDurasiPraktekKompetensi);

        await this.prismaService.capability.update({
            where: {
                id: capabilityId
            },
            data: {
                total_durasi_teori_reg_gse: totalDurasiTeoriRegGse,
                total_durasi_praktek_reg_gse: totalDurasiPraktekRegGse,
                total_durasi_teori_kompetensi: totalDurasiTeoriKompetensi,
                total_durasi_praktek_kompetensi: totalDurasiPraktekKompetensi,
            }
        });

        return "Berhasil membuat Curriculum & Syllabus";
    }

    async getCurriculumSyllabusByCapabilityId(capabilityId: string): Promise<any> {
        const curriculumSyllabus = await this.prismaService.curriculumSyllabus.findMany({
            where: {
                capabilityId: capabilityId,
            }
        });

        if(!curriculumSyllabus) {
            throw new HttpException('Curriculum & Syllabus Not Found', 404);
        }

        return curriculumSyllabus;
    }

    async listCurriculumSyllabus(request: ListRequest): Promise<{ data: any[], actions: ActionAccessRights, paging: Paging }> {
        let curriculumSyllabus: any[];

        curriculumSyllabus = await this.prismaService.curriculumSyllabus.findMany();

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
