import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { CreateParticipantRequest, ListParticipantResponse, ParticipantList, ParticipantResponse, UpdateParticipantRequest } from "../model/participant.model";
import * as QRCode from 'qrcode';
import { ValidationService } from "../common/service/validation.service";
import { ParticipantValidation } from "./participant.validation";
import * as puppeteer from 'puppeteer';
import { IdCardModel } from "../model/id-card.model";
import { CurrentUserRequest } from "src/model/auth.model";
import { Participant } from "@prisma/client";
import { ActionAccessRights, ListRequest, Paging, SearchRequest } from "src/model/web.model";
import { ConfigService } from "@nestjs/config";
import { CoreHelper } from "src/shared/helpers/core.helper";

@Injectable()
export class ParticipantService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
        private readonly configService: ConfigService,
        private readonly coreHelper: CoreHelper,
    ) {}

    async createParticipant(data: CreateParticipantRequest, user: CurrentUserRequest): Promise<ParticipantResponse> {
        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

        if(userRole === 'lcu') {
            if(!data.dinas) {
                throw new HttpException('Dinas tidak boleh kosong', 400);
            } else if(user.user.dinas != data.dinas) {
                throw new HttpException('LCU hanya bisa menambahkan pengguna dengan role user dengan dinas yang sama', 400);
            }
        }

        if(data.nik) {
            await this.coreHelper.ensureUniqueFields('participant', [
                { field: 'nik', value: data.nik, message: 'NIK sudah ada di data peserta' }
            ]);
        }

        await this.coreHelper.ensureUniqueFields('participant', [
            { field: 'email', value: data.email, message: 'Email sudah ada di data peserta' }
        ]);

        if(data.company) {
            data.gmfNonGmf = data.company.toLowerCase().includes('gmf') ? 'GMF' : 'Non GMF';
        }

        const validatedData = this.validationService.validate(ParticipantValidation.CREATE, data);
        validatedData.dinas ? validatedData.dinas.toUpperCase() : validatedData.dinas;
        validatedData.bidang ? validatedData.bidang.toUpperCase() : validatedData.bidang;

        const participant = await this.prismaService.participant.create({
            data: {
                idNumber: validatedData.idNumber,
                name: validatedData.name,
                nik: validatedData.nik,
                dinas: validatedData.dinas,
                bidang: validatedData.bidang,
                company: validatedData.company,
                email: validatedData.email,
                phoneNumber: validatedData.phoneNumber,
                nationality: validatedData.nationality,
                placeOfBirth: validatedData.placeOfBirth,
                dateOfBirth: validatedData.dateOfBirth,
                simA: validatedData.simA,
                simAFileName: validatedData.simAFileName,
                simB: validatedData.simB,
                simBFileName: validatedData.simAFileName,
                ktp: validatedData.ktp,
                ktpFileName: validatedData.ktpFileName,
                foto: validatedData.foto,
                fotoFileName: validatedData.fotoFileName,
                suratSehatButaWarna: validatedData.suratSehatButaWarna,
                suratSehatButaWarnaFileName: validatedData.suratSehatButaWarnaFileName,
                tglKeluarSuratSehatButaWarna: validatedData.tglKeluarSuratSehatButaWarna,
                suratBebasNarkoba: validatedData.suratBebasNarkoba,
                suratBebasNarkobaFileName: validatedData.suratBebasNarkobaFileName,
                tglKeluarSuratBebasNarkoba: validatedData.tglKeluarSuratBebasNarkoba,
                qrCodeLink: '',
                qrCode: null,
                gmfNonGmf: validatedData.gmfNonGmf,
            },
        });

        // Modifikasi qrCodeLink dengan ID peserta
        const link = this.configService.get<string>('QR_CODE_LINK').replace('{id}', participant.id);

        // Generate QR code
        const qrCodeBase64 = await QRCode.toDataURL(link, { width: 500 });
        const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ''), 'base64');

        // Update peserta dengan QR code dan link
        const result = await this.prismaService.participant.update({
            where: { id: participant.id },
            data: {
                qrCodeLink: link,
                qrCode: qrCodeBuffer,
            },
        });

        return this.toParticipantResponse(result);
    }

    async streamFile(participantId: string, fileName: string, user: CurrentUserRequest): Promise<Buffer> {
        const participant = await this.findOneParticipant(participantId);

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

        if(userRole === 'user') {
            if(participant.nik !== user.user.nik) {
                throw new HttpException('Akses terlarang, pengguna tidak bisa mengakses data pengguna lain', 403);
            }
        }

        if(userRole === 'lcu') {
            this.validateDinasForLcuRequest(participant.dinas, user.user.dinas);
        }

        if (!participant || !participant[fileName]) {
            throw new HttpException('File tidak ditemukan', 404);
        }

        return participant[fileName];
    }

    async getParticipant(participantId: string, user: CurrentUserRequest): Promise<ParticipantResponse> {
        const participant = await this.findOneParticipant(participantId);

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

        if(userRole === 'user') {
            if(participant.nik !== user.user.nik) {
                throw new HttpException('Akses terlarang, pengguna tidak bisa mengakses data pengguna lain', 403);
            }
        }

        if(userRole === 'lcu') {
            this.validateDinasForLcuRequest(participant.dinas, user.user.dinas);
        }

        return this.toParticipantResponse(participant);
    }

    async downloadIdCard(participantId: string): Promise<Buffer> {
        const participant = await this.prismaService.participant.findUnique({
            where: { id: participantId },
        });

        if (!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        if (!participant.foto || !participant.company || !participant.nationality || !participant.qrCode) {
            throw new HttpException('ID Card tidak bisa diunduh, lengkapi data terlebih dahulu', 400);
        }

        const idCardModel = new IdCardModel(participant.foto, participant.qrCode, participant.name, participant.company, participant.idNumber, participant.nationality);

        const htmlContent = idCardModel.getHtmlTemplate();

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(await htmlContent, { waitUntil: 'networkidle0' });
    
        const pdfBuffer = await page.pdf({ format: 'A4' });

        await browser.close(); // Don't forget to close the browser after generating PDF
    
        return Buffer.from(pdfBuffer);
    }

    async getIdCard(participantId: string): Promise<string> {
        const participant = await this.prismaService.participant.findUnique({
            where: { id: participantId },
        });

        if (!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        if (!participant.foto || !participant.company || !participant.nationality || !participant.qrCode) {
            throw new HttpException('ID Card tidak bisa dilihat, lengkapi data terlebih dahulu', 400);
        }

        const idCardModel = new IdCardModel(participant.foto, participant.qrCode, participant.name, participant.company, participant.idNumber, participant.nationality);

        const htmlContent = idCardModel.getHtmlTemplate();
    
        return htmlContent;
    }

    async updateParticipant(participantId: string, req: UpdateParticipantRequest, user: CurrentUserRequest): Promise<ParticipantResponse> {
        req.gmfNonGmf = req.company.toLowerCase().includes('gmf') || req.company.toLowerCase().includes('garuda maintenance facility') ? 'GMF' : 'Non GMF';
        const updateRequest = this.validationService.validate(ParticipantValidation.UPDATE, req);

        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId,
            }
        });

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

        if(userRole !== 'super admin' && updateRequest.email) {
            throw new HttpException('Anda tidak bisa mengubah email participant', 400);
        }

        if(updateRequest.email) {
            await this.coreHelper.ensureUniqueFields('participant', [
                { field: 'email', value: updateRequest.email, message: 'Email sudah ada di data peserta', }
            ], participantId);
        }

        let result: any;

        if(updateRequest.qrCodeLink || (!participant.qrCodeLink || !participant.qrCode)) {
            // Modifikasi qrCodeLink dengan ID peserta
            const qrCodeLink = updateRequest.qrCodeLink.replace('{id}', participant.id);

            // Generate QR code
            const qrCodeBase64 = await QRCode.toDataURL(qrCodeLink, { width: 500 });
            const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ''), 'base64');

            result = await this.prismaService.participant.update({
                where: { id: participantId },
                data: {
                    ...updateRequest,
                    qrCodeLink: qrCodeLink,
                    qrCode: qrCodeBuffer,
                },
            });
        } else {

            result = await this.prismaService.participant.update({
                where: { id: participantId },
                data: {
                    ...updateRequest,
                },
            });
        }

        if(participant.nik) {
            const updateUser = {
                idNumber: updateRequest.idNumber,
                name: updateRequest.name,
                nik: updateRequest.nik,
                dinas: updateRequest.dinas,
                email: updateRequest.email,
            };

            const userUpdate = await this.prismaService.user.findUnique({
                where: {
                    participantId: participant.id,
                },
            });
        
            if(userUpdate) {
                await this.prismaService.user.update({
                    where: {
                        id: userUpdate.id,
                    },
                    data: updateUser,
                });
            }
        }

        return this.toParticipantResponse(result);
    }

    async deleteParticipant(participantId: string, user: CurrentUserRequest): Promise<string> {
        const participant = await this.findOneParticipant(participantId);
    
        if (!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }
    
        if (user.user.dinas || user.user.dinas !== null) {
            this.validateDinasForLcuRequest(participant.dinas, user.user.dinas);
        }
    
        // Gunakan Prisma Transaction
        await this.prismaService.$transaction(async (prisma) => {
            // Hapus user terkait (jika ada)
            const findUser = await prisma.user.findFirst({
                where: {
                    participantId: participant.id,
                },
            });
    
            if (findUser) {
                await prisma.user.delete({
                    where: {
                        id: findUser.id,
                    },
                });
            }
    
            // Hapus data terkait di tabel participantsCOT
            await prisma.participantsCOT.deleteMany({
                where: {
                    participantId: participantId,
                },
            });
    
            // Hapus data peserta
            await prisma.participant.delete({
                where: {
                    id: participantId,
                },
            });
        });
    
        return 'Berhasil menghapus participant';
    }    

    async listParticipants(req: ListRequest, user: CurrentUserRequest):Promise<{ data: ParticipantResponse[], actions: ActionAccessRights, paging: Paging }> {
        const listRequest: ListRequest = this.validationService.validate(ParticipantValidation.LIST, req);
        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

        let participants: ParticipantList[];

        const participantSelectFields = {
            id: true,
            idNumber: true,
            name: true,
            dinas: true,
            bidang: true,
            company: true,
            email: true,
        }

        if (userRole === 'super admin') {
            participants = await this.prismaService.participant.findMany({
                select: participantSelectFields,
            });
        } else if (userRole === 'lcu' || userRole === 'user') {
            participants = await this.prismaService.participant.findMany({
                where: {
                    dinas: user.user.dinas,
                },
                select: {
                    ...participantSelectFields,
                    nik: false,
                },
            });
        } else {
            throw new HttpException('Forbidden', 403);
        }

        const totalUsers = participants.length;
        const totalPage = Math.ceil(totalUsers / req.size);
        const paginatedUsers = participants.slice(
            (req.page - 1) * req.size,
            req.page * req.size
        );

        const accessRights = this.validateActions(userRole);

        return {
            data: paginatedUsers.map(participant => this.toParticipantResponse(participant)),
            actions: accessRights,
            paging: {
                currentPage: listRequest.page,
                totalPage: totalPage,
                size: listRequest.size,
            },
        };
    }

    async searchParticipant(req: SearchRequest, user: CurrentUserRequest): Promise<{ data: ListParticipantResponse[], actions: ActionAccessRights, paging: Paging }> {
        const searchRequest: SearchRequest = this.validationService.validate(ParticipantValidation.SEARCH, req);

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();
        
        const participantSelectFields = {
            id: true,
            idNumber: true,
            name: true,
            email: true,
            dinas: true,
            bidang: true,
            company: true,
        };

        // Prepare where clause for Prisma based on role and search query
        let whereClause: any = {};

        // Add dinas filter if user is LCU
        if (userRole === 'lcu') {
            whereClause.dinas = user.user.dinas;
        }

        // Add search query filters if provided
        if (searchRequest.searchQuery) {
            const query = searchRequest.searchQuery.toLowerCase();
            if (userRole === 'super admin' || userRole === 'supervisor') {
                whereClause.OR = [
                    { idNumber: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { dinas: { contains: query, mode: 'insensitive' } },
                    { bidang: { contains: query, mode: 'insensitive' } },
                    { company: { contains: query, mode: 'insensitive' } },
                ];
            } else {
                whereClause.OR = [
                    { idNumber: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { bidang: { contains: query, mode: 'insensitive' } },
                ];
            }
        }

        // Fetch participants directly with filters
        const participants = await this.prismaService.participant.findMany({
            where: whereClause,
            select: participantSelectFields,
        });

        const totalParticipants = participants.length;
        const totalPage = Math.ceil(totalParticipants / searchRequest.size);

        const accessRights = this.validateActions(userRole);

        return {
            data: participants.map(participant => ({
                id: participant.id,
                idNumber: participant.idNumber,
                name: participant.name,
                email: participant.email,
                dinas: participant.dinas,
                bidang: participant.bidang,
                company: participant.company
            })),
            actions: accessRights,
            paging: {
                currentPage: searchRequest.page,
                totalPage: totalPage,
                size: searchRequest.size,
            },
        };
    }

    async isDataComplete(participantId: string): Promise<boolean> {
        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId
            },
            select: {
                name: true,
                nik: true,
                company: true,
                email: true,
                phoneNumber: true,
                nationality: true,
                placeOfBirth: true,
                dateOfBirth: true,
                simA: true,
                ktp: true,
                foto: true,
                suratSehatButaWarna: true,
                tglKeluarSuratSehatButaWarna: true,
                suratBebasNarkoba: true,
                tglKeluarSuratBebasNarkoba: true,
            }
        });

        const isComplete = participant && Object.values(participant).every(value => value !== null && value !== undefined);
        return isComplete;
    }

    toParticipantResponse(participant: any): ParticipantResponse {
        return {
            id: participant.id,
            idNumber: participant.idNumber,
            name: participant.name,
            nik: participant.nik,
            dinas: participant.dinas,
            bidang: participant.bidang,
            company: participant.company,
            email: participant.email,
            phoneNumber: participant.phoneNumber,
            nationality: participant.nationality,
            placeOfBirth: participant.placeOfBirth,
            simAFileName: participant.simAFileName,
            simBFileName: participant.simBFileName,
            ktpFileName: participant.ktpFileName,
            fotoFileName: participant.fotoFileName,
            suratSehatButaWarnaFileName: participant.suratSehatButaWarnaFileName,
            suratBebasNarkobaFileName: participant.suratBebasNarkobaFileName,
            dateOfBirth: participant.dateOfBirth,
            tglKeluarSuratSehatButaWarna: participant.tglKeluarSuratSehatButaWarna,
            tglKeluarSuratBebasNarkoba: participant.tglKeluarSuratBebasNarkoba,
            gmfNonGmf: participant.gmfNonGmf,
            qrCodeLink: participant.qrCodeLink,
        };
    }

    formatDate(date: Date): string {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice();

        return `${day}-${month}-${year}`;
    }

    private async findOneParticipant(participantId: string): Promise<Participant> {
        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId
            },
        });
        return participant
    }

    private validateDinasForLcuRequest(participantDinas: string, lcuDinas: string) {
        if(participantDinas != lcuDinas) {
            throw new HttpException('LCU hanya bisa menambahkan, melihat, dan menghapus data peserta dengan dinas yang sama', 403);
        }
    }

    private validateActions(userRole: string): ActionAccessRights {
        const accessMap = {
            'super admin': { canEdit: true, canDelete: true, canView: true, },
            'supervisor': { canEdit: false, canDelete: false, canView: true, },
            'lcu': { canEdit: true, canDelete: true, canView: true, },
        };
        
        return this.coreHelper.validateActions(userRole, accessMap);
    }
}
