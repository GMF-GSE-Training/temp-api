import { HttpException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from 'winston';
import { CreateParticipantRequest, ListParticipantResponse, ParticipantList, ParticipantResponse, UpdateParticipantRequest } from "../model/participant.model";
import * as QRCode from 'qrcode';
import { ValidationService } from "../common/service/validation.service";
import { ParticipantValidation } from "./participant.validation";
import * as puppeteer from 'puppeteer';
import { IdCardModel } from "../model/id_card.model";
import { CurrentUserRequest } from "src/model/auth.model";
import { Participant } from "@prisma/client";
import { ActionAccessRights, ListRequest, Paging, SearchRequest } from "src/model/web.model";

@Injectable()
export class ParticipantService {
    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private validationService: ValidationService,
    ) {}

    async createParticipant(data: CreateParticipantRequest, user: CurrentUserRequest): Promise<ParticipantResponse> {
        const userWithRole = await this.userWithRole(user.user.id);

        const userRole = userWithRole.role.role.toLowerCase();
        if(userRole === 'lcu') {
            if(!data.dinas) {
                throw new HttpException('Dinas tidak boleh kosong', 400);
            } else if(userWithRole.dinas != data.dinas) {
                throw new HttpException('LCU hanya bisa menambahkan pengguna dengan role user dengan dinas yang sama', 400);
            }
        }

        if(!data.nik) {
            throw new HttpException('NIK tidak boleh kosong', 400);
        }

        const nikIsAlreadyExists = await this.prismaService.participant.findUnique({
            where: {
                nik: data.nik,
            }
        });

        if(nikIsAlreadyExists) {
            throw new HttpException('NIK sudah ada di data peserta', 400);
        }

        data.gmf_non_gmf = data.perusahaan.toLowerCase().includes('gmf') || data.perusahaan.toLowerCase().includes('garuda maintenance facility') ? 'GMF' : 'Non GMF';

        const validatedData = this.validationService.validate(ParticipantValidation.CREATE, data);

        const participant = await this.prismaService.participant.create({
            data: {
                no_pegawai: validatedData.no_pegawai,
                nama: validatedData.nama,
                nik: validatedData.nik,
                dinas: validatedData.dinas,
                bidang: validatedData.bidang,
                perusahaan: validatedData.perusahaan,
                email: validatedData.email,
                no_telp: validatedData.no_telp,
                negara: validatedData.negara,
                tempat_lahir: validatedData.tempat_lahir,
                tanggal_lahir: validatedData.tanggal_lahir,
                sim_a: validatedData.sim_a,
                sim_b: validatedData.sim_b,
                ktp: validatedData.ktp,
                foto: validatedData.foto,
                surat_sehat_buta_warna: validatedData.surat_sehat_buta_warna,
                exp_surat_sehat: validatedData.exp_surat_sehat,
                surat_bebas_narkoba: validatedData.surat_bebas_narkoba,
                exp_bebas_narkoba: validatedData.exp_bebas_narkoba,
                link_qr_code: '',
                qr_code: null,
                gmf_non_gmf: validatedData.gmf_non_gmf,
            },
        });

    // Modifikasi link_qr_code dengan ID peserta
    const link = data.link_qr_code.replace('{id}', participant.id);

    // Generate QR code
    const qrCodeBase64 = await QRCode.toDataURL(link);
    const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ''), 'base64');

    // Update peserta dengan QR code dan link
    const result = await this.prismaService.participant.update({
        where: { id: participant.id },
        data: {
            link_qr_code: link,
            qr_code: qrCodeBuffer,
        },
    });

        return this.toParticipantResponse(result);
    }

    async streamFile(participantId: string, fileType: string, user: CurrentUserRequest): Promise<Buffer> {
        const participant = await this.findOneParticipant(participantId);

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        if(user.user.dinas || user.user.dinas !== null) {
            this.validateDinasForLcuRequest(participant.dinas, user.user.dinas);
        }

        if (!participant || !participant[fileType]) {
            throw new HttpException('File tidak ditemukan', 404);
        }

        return participant[fileType];
    }

    async getParticipant(participantId: string, user: CurrentUserRequest): Promise<ParticipantResponse> {
        const participant = await this.findOneParticipant(participantId);

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        if(user.user.dinas || user.user.dinas !== null) {
            this.validateDinasForLcuRequest(participant.dinas, user.user.dinas);
        }

        const userWithRole = await this.userWithRole(user.user.id);

        const userRole = userWithRole.role.role.toLowerCase();
        if(userRole === 'super admin' || userRole === 'lcu') {
            return this.toParticipantResponse(participant);
        } else {
            const { nik, ...participantWhitoutNik } = participant;
            return this.toParticipantResponse(participantWhitoutNik);
        }
    }

    async downloadIdCard(participantId: string): Promise<Buffer> {
        const participant = await this.prismaService.participant.findUnique({
            where: { id: participantId },
        });

        if (!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        const idCardModel = new IdCardModel(participant.foto, participant.qr_code, participant.nama, participant.perusahaan, participant.no_pegawai, participant.negara);

        const htmlContent = idCardModel.getHtmlTemplate();

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(await htmlContent, { waitUntil: 'networkidle0' });
    
        const pdfBuffer = await page.pdf({ format: 'A4' });
    
        return Buffer.from(pdfBuffer);
    }

    async getIdCard(participantId: string): Promise<string> {
        const participant = await this.prismaService.participant.findUnique({
            where: { id: participantId },
        });

        if (!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        const idCardModel = new IdCardModel(participant.foto, participant.qr_code, participant.nama, participant.perusahaan, participant.no_pegawai, participant.negara);

        const htmlContent = idCardModel.getHtmlTemplate();
    
        return htmlContent;
    }

    async updateParticipant(participantId: string, req: UpdateParticipantRequest): Promise<ParticipantResponse> {
        const updateRequest = this.validationService.validate(ParticipantValidation.UPDATE, req);
        if(req.nik) {
            const nikIsAlreadyExists = await this.prismaService.participant.count({
                where: {
                    nik: req.nik,
                }
            });

            if(nikIsAlreadyExists > 1) {
                throw new HttpException('NIK sudah ada di data peserta', 400);
            }
        }

        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId,
            }
        });

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        updateRequest.no_pegawai === "null" ? updateRequest.no_pegawai = null : updateRequest.no_pegawai;
        updateRequest.dinas === "null" ? updateRequest.dinas = null : updateRequest.dinas;
        updateRequest.bidang === "null" ? updateRequest.bidang = null : updateRequest.bidang;

        const result = await this.prismaService.participant.update({
            where: { id: participantId },
            data: updateRequest,
        });

        if(req.nik || req.dinas) {
            const updateData: { nik?: string; dinas?: string } = {};

            if (req.nik) {
                updateData.nik = req.nik;
            }

            if (req.dinas || req.dinas != '') {
                updateData.dinas = req.dinas;
            }

            await this.prismaService.user.update({
                where: {
                    nik: participant.nik,
                },
                data: updateData,
            });
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
                    nik: participant.nik,
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
            no_pegawai: true,
            nama: true,
            nik: true,
            dinas: true,
            bidang: true,
            perusahaan: true,
            email: true,
            no_telp: true,
            negara: true,
            tempat_lahir: true,
            tanggal_lahir: true,
            exp_surat_sehat: true,
            exp_bebas_narkoba: true,
            gmf_non_gmf: true,
            link_qr_code: true,
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
                    dinas: userWithRole.dinas,
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
                current_page: listRequest.page,
                total_page: totalPage,
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
            no_pegawai: true,
            nama: true,
            email: true,
            no_telp: true,
            dinas: true,
            bidang: true,
            perusahaan: true,
        };

        // Prepare where clause for Prisma based on role and search query
        let whereClause: any = {};

        // Add dinas filter if user is LCU
        if (userRole === 'lcu') {
            whereClause.dinas = userWithRole.dinas;
        }

        // Add search query filters if provided
        if (searchRequest.searchQuery) {
            const query = searchRequest.searchQuery.toLowerCase();
            if (userRole === 'super admin' || userRole === 'supervisor') {
                whereClause.OR = [
                    { no_pegawai: { contains: query, mode: 'insensitive' } },
                    { nama: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { no_telp: { contains: query, mode: 'insensitive' } },
                    { dinas: { contains: query, mode: 'insensitive' } },
                    { bidang: { contains: query, mode: 'insensitive' } },
                    { perusahaan: { contains: query, mode: 'insensitive' } },
                ];
            } else {
                whereClause.OR = [
                    { no_pegawai: { contains: query, mode: 'insensitive' } },
                    { nama: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { no_telp: { contains: query, mode: 'insensitive' } },
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
                no_pegawai: participant.no_pegawai,
                nama: participant.nama,
                email: participant.email,
                no_telp: participant.no_telp,
                dinas: participant.dinas,
                bidang: participant.bidang,
                perusahaan: participant.perusahaan
            })),
            actions: actions,
            paging: {
                current_page: searchRequest.page,
                total_page: totalPage,
                size: searchRequest.size,
            },
        };
    }

    toParticipantResponse(participant: ParticipantList): ParticipantResponse {
        return {
            id: participant.id,
            no_pegawai: participant.no_pegawai,
            nama: participant.nama,
            nik: participant.nik,
            dinas: participant.dinas,
            bidang: participant.bidang,
            perusahaan: participant.perusahaan,
            email: participant.email,
            no_telp: participant.no_telp,
            negara: participant.negara,
            tempat_lahir: participant.tempat_lahir,
            tanggal_lahir: this.formatDate(new Date(participant.tanggal_lahir)),
            exp_surat_sehat: this.formatDate(new Date(participant.exp_surat_sehat)),
            exp_bebas_narkoba: this.formatDate(new Date(participant.exp_bebas_narkoba)),
            gmf_non_gmf: participant.gmf_non_gmf,
            link_qr_code: participant.link_qr_code,
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
            include: {
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
}
