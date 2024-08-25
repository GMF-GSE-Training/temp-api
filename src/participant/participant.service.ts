import { HttpException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from 'winston';
import { CreateParticipantRequest, ParticipantResponse, UpdateParticipantRequest } from "../model/participant.model";
import * as QRCode from 'qrcode';
import { ValidationService } from "../common/service/validation.service";
import { ParticipantValidation } from "./participant.validation";


@Injectable()
export class ParticipantService {
    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private validationService: ValidationService,
    ) {}

    async createParticipant(data: CreateParticipantRequest): Promise<ParticipantResponse> {
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

    async streamFile(participantId: number, fileType: string): Promise<Buffer> {
        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId
            },
        });

        if (!participant || !participant[fileType]) {
            throw new HttpException('File tidak ditemukan', 404);
        }

        return participant[fileType];
    }

    async updateParticipant(participantId: number, req: UpdateParticipantRequest): Promise<ParticipantResponse> {
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

    async deleteParticipant(participantId: number): Promise<ParticipantResponse> {
        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId,
            }
        });

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        const user = await this.prismaService.user.findUnique({
            where: {
                nik: participant.nik,
            }
        });

        if(user) {
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

        return result;
    }

    toParticipantResponse(participant: ParticipantResponse): ParticipantResponse {
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
            tanggal_lahir: participant.tanggal_lahir,
            exp_surat_sehat: participant.exp_surat_sehat,
            exp_bebas_narkoba: participant.exp_bebas_narkoba,
            link_qr_code: participant.link_qr_code || '',
            gmf_non_gmf: participant.gmf_non_gmf,
        };
    }
}
