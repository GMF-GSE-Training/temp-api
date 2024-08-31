import { HttpException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from 'winston';
import { CreateParticipantRequest, ParticipantList, ParticipantResponse, UpdateParticipantRequest } from "../model/participant.model";
import * as QRCode from 'qrcode';
import { ValidationService } from "../common/service/validation.service";
import { ParticipantValidation } from "./participant.validation";
import * as puppeteer from 'puppeteer';
import { IdCardModel } from "../model/id_card.model";
import { CurrentUserRequest } from "src/model/auth.model";
import { Participant } from "@prisma/client";
import { ListRequest, Paging, SearchRequest } from "src/model/web.model";

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

        if(!data.link_qr_code) {
            throw new HttpException('Link tidak boleh kosong', 400);
        }

        const qrCodeBase64 = await QRCode.toDataURL(data.link_qr_code);
        const qrCodeBuffer = Buffer.from(qrCodeBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
        data.qr_code = qrCodeBuffer;
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
                link_qr_code: validatedData.link_qr_code,
                qr_code: validatedData.qr_code,
                gmf_non_gmf: validatedData.gmf_non_gmf,
            },
        });

        return this.toParticipantResponse(participant);
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

        return this.toParticipantResponse(participant);
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

        const result = await this.prismaService.participant.update({
            where: {
                id: participantId,
            },
            data: updateRequest,
        });

        if(req.nik) {
            await this.prismaService.user.update({
                where: {
                    nik: req.nik,
                },
                data: {
                    nik: req.nik
                }
            });
        }

        return this.toParticipantResponse(result);
    }

    async deleteParticipant(participantId: string, user: CurrentUserRequest): Promise<ParticipantResponse> {
        const participant = await this.findOneParticipant(participantId);

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        this.validateDinasForLcuRequest(participant.dinas, user.user.dinas);

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

    async listParticipants(req: ListRequest, user: CurrentUserRequest):Promise<{ data: ParticipantResponse[], paging: Paging }> {
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

        if (userRole === 'supervisor' || userRole === 'super admin') {
            participants = await this.prismaService.participant.findMany({
                select: participantSelectFields,
            });
        } else if (userRole === 'lcu') {
            participants = await this.prismaService.participant.findMany({
                where: {
                    dinas: userWithRole.dinas,
                },
                select: participantSelectFields,
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

        return {
            data: paginatedUsers.map(participant => this.toParticipantResponse(participant)),
            paging: {
                current_page: listRequest.page,
                total_page: totalPage,
                size: listRequest.size,
                links: {
                    next: totalPage > listRequest.page ? `/participants/list/result?page=${listRequest.page + 1}&size=${listRequest.size}` : null,
                    prev: listRequest.page > 1 ? `/participants/list/result?page=${listRequest.page - 1}&size=${listRequest.size}` : null,
                }
            },
        };
    }

    async searchParticipant(req: SearchRequest, user: CurrentUserRequest): Promise<{ data: ParticipantResponse[], paging: Paging }> {
        const searchRequest: SearchRequest = this.validationService.validate(ParticipantValidation.SEARCH, req);

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();
        let participants = await this.prismaService.participant.findMany({});

        if (userRole === 'lcu') {
            participants = participants.filter(u => u.dinas=== userWithRole.dinas);
        }

        let filteredParticipants = participants;
        if (searchRequest.searchQuery) {
            const query = searchRequest.searchQuery.toLowerCase();
            if (userRole === 'super admin' || userRole === 'supervisor') {
                filteredParticipants = participants.filter(participant => 
                    participant.no_pegawai?.toLowerCase().includes(query) ||
                    participant.nama.toLowerCase().includes(query) ||
                    participant.email.toLowerCase().includes(query) ||
                    participant.no_telp.includes(query) ||
                    participant.dinas?.toLowerCase().includes(query) ||
                    participant.bidang?.toLowerCase().includes(query) ||
                    participant.perusahaan?.toLowerCase().includes(query)
                );
            } else {
                filteredParticipants = participants.filter(participant => 
                    participant.no_pegawai?.toLowerCase().includes(query) ||
                    participant.nama.toLowerCase().includes(query) ||
                    participant.email.toLowerCase().includes(query) ||
                    participant.no_telp.includes(query) ||
                    participant.bidang?.toLowerCase().includes(query)
                );
            }
    
        }

        const totalParticipants = filteredParticipants.length;
        const totalPage = Math.ceil(totalParticipants / searchRequest.size);
        const paginatedParticipants = filteredParticipants.slice(
            (searchRequest.page - 1) * searchRequest.size,
            searchRequest.page * searchRequest.size
        );

        if (paginatedParticipants.length === 0) {
            throw new HttpException("Data peserta tidak ditemukan", 404);
        }

        return {
            data: paginatedParticipants.map(participant => ({
                ...this.toParticipantResponse(participant),
                links: {
                    self: `/participants/${participant.id}`,
                    update: `/participants/${participant.id}`,
                    delete: `/participants/${participant.id}`,
                }
            })),
            paging: {
                current_page: searchRequest.page,
                total_page: totalPage,
                size: searchRequest.size,
                links: {
                    next: totalPage > searchRequest.page ? `/participants/search/result?paging=${searchRequest.page + 1}&size=${searchRequest.size}` : null,
                    prev: searchRequest.page > 1 ? `/participants/search/result?paging=${searchRequest.page - 1}&size=${searchRequest.size}` : null,
                }
            },
        };
    }

    toParticipantResponse(participant: ParticipantList): ParticipantResponse {
        return {
            id: participant.id,
            no_pegawai: participant.no_pegawai,
            nama: participant.nama,
            dinas: participant.dinas,
            bidang: participant.bidang,
            perusahaan: participant.perusahaan,
            email: participant.email,
            no_telp: participant.no_telp,
            negara: participant.negara,
            tempat_lahir: participant.tempat_lahir,
            tanggal_lahir: participant.tanggal_lahir,
            exp_surat_sehat: participant.exp_surat_sehat,
            exp_bebas_narkoba: participant.exp_bebas_narkoba,
            gmf_non_gmf: participant.gmf_non_gmf,
            link_qr_code: participant.link_qr_code,
            links: {
                self: `/participants/${participant.id}`,
                update: `/participants/${participant.id}`,
                delete: `/participants/${participant.id}`,
            },
        };
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
}
