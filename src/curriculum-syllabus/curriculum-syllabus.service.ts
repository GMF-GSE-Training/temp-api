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
}
