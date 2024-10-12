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
        const { curriculumSyllabus } = request;

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

        await this.prismaService.capability.update({
            where: {
                id: capabilityId
            },
            data: {
                totalDurasiTeoriRegGse: totalDurasiTeoriRegGse,
                totalDurasiPraktekRegGse: totalDurasiPraktekRegGse,
                totalDurasiTeoriKompetensi: totalDurasiTeoriKompetensi,
                totalDurasiPraktekKompetensi: totalDurasiPraktekKompetensi,
            }
        });

        return "Berhasil membuat Curriculum & Syllabus";
    }

    async getCurriculumSyllabusByCapabilityId(capabilityId: string): Promise<any> {
        const curriculumSyllabus = await this.prismaService.curriculumSyllabus.findMany({
            where: {
                capabilityId: capabilityId,
            },
            include: {
                capability: {
                    select: {
                        id: true,
                        kodeRating: true,
                        namaTraining: true,
                    }
                },
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
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            },
        };
    }
}
