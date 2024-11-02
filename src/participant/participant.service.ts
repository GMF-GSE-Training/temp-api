import { HttpException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from 'winston';
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

@Injectable()
export class ParticipantService {
    constructor(
        private readonly prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private readonly validationService: ValidationService,
        private readonly configService: ConfigService,
    ) {}

    async createParticipant(data: CreateParticipantRequest, user: CurrentUserRequest): Promise<ParticipantResponse> {
        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

        if(userRole === 'lcu') {
            if(!data.dinas) {
                throw new HttpException('Dinas tidak boleh kosong', 400);
            } else if(user.user.dinas != data.dinas) {
                throw new HttpException('LCU hanya bisa menambahkan pengguna dengan role user dengan dinas yang sama', 400);
            }
        }

        if(data.nik) {
            const nikIsAlreadyExists = await this.prismaService.participant.count({
                where: {
                    nik: data.nik,
                }
            });
    
            if(nikIsAlreadyExists) {
                throw new HttpException('NIK sudah ada di data peserta', 400);
            }
        }

        if(userRole === 'user') {
            if(data.nik !== user.user.nik) {
                throw new HttpException('NIK tidak sama dengan data pengguna', 400);
            }
        }

        if(data.perusahaan) {
            data.gmfNonGmf = data.perusahaan.toLowerCase().includes('gmf') || data.perusahaan.toLowerCase().includes('garuda maintenance facility') ? 'GMF' : 'Non GMF';
        }

        const validatedData = this.validationService.validate(ParticipantValidation.CREATE, data);

        const participant = await this.prismaService.participant.create({
            data: {
                noPegawai: validatedData.noPegawai,
                nama: validatedData.nama,
                nik: validatedData.nik,
                dinas: validatedData.dinas,
                bidang: validatedData.bidang,
                perusahaan: validatedData.perusahaan,
                email: validatedData.email,
                noTelp: validatedData.noTelp,
                negara: validatedData.negara,
                tempatLahir: validatedData.tempatLahir,
                tanggalLahir: validatedData.tanggalLahir,
                simA: validatedData.simA,
                simAFileName: validatedData.simAFileName,
                simB: validatedData.simB,
                simBFileName: validatedData.simAFileName,
                ktp: validatedData.ktp,
                ktpFileName: validatedData.ktpFileName,
                foto: validatedData.foto,
                fotoFileName: validatedData.fotoFileName,
                suratSehatButaWarna: validatedData.suratSehatButaWarna,
                suratSehatButaWarnaFileName: validatedData.suratSehatbutaWarnaFileName,
                tglKeluarSuratSehatButaWarna: validatedData.tglKeluarSuratSehatButaWarna,
                suratBebasNarkoba: validatedData.suratBebasNarkoba,
                suratBebasNarkobaFileName: validatedData.suratBebasNarkobaFileName,
                tglKeluarSuratBebasNarkoba: validatedData.tglKeluarSuratBebasNarkoba,
                linkQrCode: '',
                qrCode: null,
                gmfNonGmf: validatedData.gmfNonGmf,
            },
        });

        // Modifikasi linkQrCode dengan ID peserta
        const link = this.configService.get<string>('QR_CODE_LINK').replace('{id}', participant.id);

        // Generate QR code
        const qrCodeBase64 = await QRCode.toDataURL(link);
        const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ''), 'base64');

        // Update peserta dengan QR code dan link
        const result = await this.prismaService.participant.update({
            where: { id: participant.id },
            data: {
                linkQrCode: link,
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

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

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

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

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

        if (!participant.foto || !participant.perusahaan || !participant.negara || !participant.qrCode) {
            throw new HttpException('ID Card tidak bisa diunduh, lengkapi data terlebih dahulu', 400);
        }

        const idCardModel = new IdCardModel(participant.foto, participant.qrCode, participant.nama, participant.perusahaan, participant.noPegawai, participant.negara);

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

        if (!participant.foto || !participant.perusahaan || !participant.negara || !participant.qrCode) {
            throw new HttpException('ID Card tidak bisa dilihat, lengkapi data terlebih dahulu', 400);
        }

        const idCardModel = new IdCardModel(participant.foto, participant.qrCode, participant.nama, participant.perusahaan, participant.noPegawai, participant.negara);

        const htmlContent = idCardModel.getHtmlTemplate();
    
        return htmlContent;
    }

    async updateParticipant(participantId: string, req: UpdateParticipantRequest, user: CurrentUserRequest): Promise<ParticipantResponse> {
        req.gmfNonGmf = req.perusahaan.toLowerCase().includes('gmf') || req.perusahaan.toLowerCase().includes('garuda maintenance facility') ? 'GMF' : 'Non GMF';

        const updateRequest = this.validationService.validate(ParticipantValidation.UPDATE, req);

        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId,
            }
        });

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

        if(userRole === 'user') {
            if(req.nik !== user.user.nik) {
                throw new HttpException('NIK tidak sama dengan data pengguna', 400);
            }
        }

        if(userRole !== 'super admin') {
            if(req.email) {
                throw new HttpException('Anda tidak bisa mengubah email participant', 400);
            }
        }

        // Modifikasi linkQrCode dengan ID peserta
        const link = this.configService.get<string>('QR_CODE_LINK').replace('{id}', participant.id);

        // Generate QR code
        const qrCodeBase64 = await QRCode.toDataURL(link);
        const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
        console.log(req.perusahaan)

        const updateRequestWithNulls = this.transformEmptyStringsToNull(updateRequest);

        const result = await this.prismaService.participant.update({
            where: { id: participantId },
            data: {
                ...updateRequestWithNulls,
                linkQrCode: link,
                qrCode: qrCodeBuffer,
            },
        });

        if(participant.nik) {
            const updateUser = {
                noPegawai: req.noPegawai,
                nik: req.nik,
                dinas: req.dinas,
            };
    
            const updateUserWithNulls = this.transformEmptyStringsToNull(updateUser);
    
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
                    data: updateUserWithNulls,
                });
            }
        }

        return this.toParticipantResponse(result);
    }

    async deleteParticipant(participantId: string, user: CurrentUserRequest): Promise<ParticipantResponse> {
        const participant = await this.findOneParticipant(participantId);

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        if(user.user.dinas || user.user.dinas !== null) {
            this.validateDinasForLcuRequest(participant.dinas, user.user.dinas);
        }

        const findUser = await this.prismaService.user.findUnique({
            where: {
                nik: participant.nik,
            }
        });

        if(findUser) {
            await this.prismaService.user.delete({
                where: {
                    participantId: participant.id,
                }
            });
        }

        const result = await this.prismaService.participant.delete({
            where: {
                id: participantId,
            }
        });

        return this.toParticipantResponse(result);
    }

    async listParticipants(req: ListRequest, user: CurrentUserRequest):Promise<{ data: ParticipantResponse[], actions: ActionAccessRights, paging: Paging }> {
        const listRequest: ListRequest = this.validationService.validate(ParticipantValidation.LIST, req);
        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

        let participants: ParticipantList[];

        const participantSelectFields = {
            id: true,
            noPegawai: true,
            nama: true,
            nik: true,
            dinas: true,
            bidang: true,
            perusahaan: true,
            email: true,
            noTelp: true,
            negara: true,
            tempatLahir: true,
            tanggalLahir: true,
            tglKeluarSuratSehatButaWarna: true,
            tglKeluarSuratBebasNarkoba: true,
            gmfNonGmf: true,
            linkQrCode: true,
        }

        if (userRole === 'super admin') {
            participants = await this.prismaService.participant.findMany({
                select: participantSelectFields,
            });
        } else if(userRole === 'supervisor') {
            participants = await this.prismaService.participant.findMany({
                select: {
                    ...participantSelectFields,
                    nik: false,
                },
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

        if (paginatedUsers.length === 0) {
            throw new HttpException("Data peserta tidak ditemukan", 404);
        }

        const actions = this.validateActions(userRole);

        return {
            data: paginatedUsers.map(participant => this.toParticipantResponse(participant)),
            actions: actions,
            paging: {
                currentPage: listRequest.page,
                totalPage: totalPage,
                size: listRequest.size,
            },
        };
    }

    async searchParticipant(req: SearchRequest, user: CurrentUserRequest): Promise<{ data: ListParticipantResponse[], actions: ActionAccessRights, paging: Paging }> {
        const searchRequest: SearchRequest = this.validationService.validate(ParticipantValidation.SEARCH, req);

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();
        
        const participantSelectFields = {
            id: true,
            noPegawai: true,
            nama: true,
            email: true,
            noTelp: true,
            dinas: true,
            bidang: true,
            perusahaan: true,
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
                    { noPegawai: { contains: query, mode: 'insensitive' } },
                    { nama: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { noTelp: { contains: query, mode: 'insensitive' } },
                    { dinas: { contains: query, mode: 'insensitive' } },
                    { bidang: { contains: query, mode: 'insensitive' } },
                    { perusahaan: { contains: query, mode: 'insensitive' } },
                ];
            } else {
                whereClause.OR = [
                    { noPegawai: { contains: query, mode: 'insensitive' } },
                    { nama: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { noTelp: { contains: query, mode: 'insensitive' } },
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
        const paginatedParticipants = participants.slice(
            (searchRequest.page - 1) * searchRequest.size,
            searchRequest.page * searchRequest.size
        );

        if (paginatedParticipants.length === 0) {
            throw new HttpException("Data peserta tidak ditemukan", 204);
        }

        const actions = this.validateActions(userRole);

        return {
            data: participants.map(participant => ({
                id: participant.id,
                noPegawai: participant.noPegawai,
                nama: participant.nama,
                email: participant.email,
                noTelp: participant.noTelp,
                dinas: participant.dinas,
                bidang: participant.bidang,
                perusahaan: participant.perusahaan
            })),
            actions: actions,
            paging: {
                currentPage: searchRequest.page,
                totalPage: totalPage,
                size: searchRequest.size,
            },
        };
    }

    toParticipantResponse(participant: ParticipantList): ParticipantResponse {
        return {
            id: participant.id,
            noPegawai: participant.noPegawai,
            nama: participant.nama,
            nik: participant.nik,
            dinas: participant.dinas,
            bidang: participant.bidang,
            perusahaan: participant.perusahaan,
            email: participant.email,
            noTelp: participant.noTelp,
            negara: participant.negara,
            tempatLahir: participant.tempatLahir,
            simAFileName: participant.simAFileName,
            simBFileName: participant.simBFileName,
            ktpFileName: participant.ktpFileName,
            fotoFileName: participant.fotoFileName,
            suratSehatButaWarnaFileName: participant.suratSehatButaWarnaFileName,
            suratBebasNarkobaFileName: participant.suratBebasNarkobaFileName,
            tanggalLahir: this.formatDate(new Date(participant.tanggalLahir)),
            tglKeluarSuratSehatButaWarna: this.formatDate(new Date(participant.tglKeluarSuratSehatButaWarna)),
            tglKeluarSuratBebasNarkoba: this.formatDate(new Date(participant.tglKeluarSuratBebasNarkoba)),
            gmfNonGmf: participant.gmfNonGmf,
            linkQrCode: participant.linkQrCode,
        };
    }

    formatDate(date: Date): string {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice();

        return `${day}-${month}-${year}`;
    }

    private async userWithRole(userId: string) {
        const userRequest = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                role: true
            }
        });
        return userRequest;
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
        if(userRole === 'super admin' || userRole === 'lcu') {
            return {
                canEdit: true,
                canDelete: true,
                canView: true,
            }
        } else {
            return {
                canEdit: false,
                canDelete: false,
                canView: true,
            }
        }
    }

    private transformEmptyStringsToNull(obj: any): any {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, value === '' ? null : value])
        );
    }
}
