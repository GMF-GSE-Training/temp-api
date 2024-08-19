import { ConflictException, HttpException, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../common/service/prisma.service";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from 'winston';
import { CreateParticipantRequest, ParticipantResponse } from "../model/participant.model";
import * as QRCode from 'qrcode';
import { unlink, rename, writeFile } from 'fs/promises';
import { join, extname, basename } from 'path';
import { mkdir } from 'fs/promises';
import { ValidationService } from "../common/service/validation.service";
import { ParticipantValidation } from "./participant.validation";
import { Prisma } from "@prisma/client";

@Injectable()
export class ParticipantService {
    constructor(
        private prismaService: PrismaService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private validationService: ValidationService,
    ) {}

    async create(req: CreateParticipantRequest, files: Record<string, Express.Multer.File[]>): Promise<ParticipantResponse> {
        const uploadedFilePaths: string[] = [];
    
        try {
            const filePaths: {
                sim_a?: string;
                sim_b?: string;
                ktp?: string;
                foto?: string;
                surat_sehat_buta_warna?: string;
                surat_bebas_narkoba?: string;
                qr_code?: string;
            } = {};

            const folders = {
                sim_a: join('./uploads/participants', 'sim-a'),
                sim_b: join('./uploads/participants', 'sim-b'),
                ktp: join('./uploads/participants', 'ktp'),
                foto: join('./uploads/participants', 'foto'),
                surat_sehat_buta_warna: join('./uploads/participants', 'surat_sehat_buta_warna'),
                surat_bebas_narkoba: join('./uploads/participants', 'surat_bebas_narkoba'),
                qr_code: join('./uploads/participants', 'qr-code'),
            };

            for (const folder of Object.values(folders)) {
                await mkdir(folder, { recursive: true });
                this.logger.info(`Folder checked/created: ${folder}`);
            }

            for (const [key, fileArray] of Object.entries(files)) {
                const file = fileArray[0];
                const fileExtension = extname(file.originalname).toLowerCase();

                // Replace spaces with underscores in the filename
                const originalNameWithoutExt = basename(file.originalname, fileExtension)
                    .replace(/\s+/g, '_')
                    .toLowerCase();
                const folderPath = folders[key as keyof typeof folders];
                const newFilePath = join(folderPath, `${originalNameWithoutExt}_${Date.now()}${fileExtension}`);
                
                await rename(file.path, newFilePath);
    
                // Build URL and replace backslashes with forward slashes
                const relativePath = newFilePath.replace(/^.*[\\\/]/, ''); // Get the filename with extension
                const fileUrl = `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/uploads/participants/${key}/${relativePath}`;
                filePaths[key] = fileUrl;
                uploadedFilePaths.push(newFilePath);
                this.logger.info(`File moved and URL built: ${fileUrl}`);
            }
    
            const qrCodePath = await this.generateQRCode(req.link_qr_code, folders.qr_code);
            if (!qrCodePath) {
                throw new HttpException("Alamat atau path QR Code tidak ditemukan", 404);
            }

            // Build QR code URL and replace backslashes with forward slashes
            const qrCodeRelativePath = qrCodePath.replace(/^.*[\\\/]/, '');
            const qrCodeUrl = `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}/uploads/participants/qr-code/${qrCodeRelativePath}`;
            filePaths.qr_code = qrCodeUrl;
            uploadedFilePaths.push(qrCodePath);
            this.logger.info(`QR code generated and URL built: ${qrCodeUrl}`);

            const createRequest: CreateParticipantRequest = {
                ...req,
                sim_a: filePaths.sim_a,
                sim_b: filePaths.sim_b,
                ktp: filePaths.ktp,
                foto: filePaths.foto,
                surat_sehat_buta_warna: filePaths.surat_sehat_buta_warna,
                surat_bebas_narkoba: filePaths.surat_bebas_narkoba,
                qr_code: filePaths.qr_code,
                tanggal_lahir: new Date(req.tanggal_lahir),
                exp_surat_sehat: new Date(req.exp_surat_sehat),
                exp_bebas_narkoba: new Date(req.exp_bebas_narkoba),
            };

            const validateRequest = this.validationService.validate(ParticipantValidation.CREATE, createRequest);
    
            const participant = await this.prismaService.participant.create({
                data: validateRequest,
            });

            return this.toParticipantResponse(participant);
        } catch (error) {
            this.logger.error(`Error in create method: ${error.message}`);
            for (const filePath of uploadedFilePaths) {
                await unlink(filePath).catch(err => this.logger.warn(`Failed to delete file: ${filePath}`));
            }
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('NIK sudah ada');
                }
            }

            throw error;
        }
    }

    async get(participantId: number): Promise<ParticipantResponse> {
        const participant = await this.prismaService.participant.findUnique({
            where: {
                id: participantId,
            }
        });

        if(!participant) {
            throw new HttpException('Peserta tidak ditemukan', 404);
        }

        return this.toParticipantResponse(participant);
    }

    async generateQRCode(link: string, folderPath: string): Promise<string> {
        if (!link) {
            this.logger.warn('QR code generation skipped: link is null or empty');
            return null;
        }
        try {
            const qrCodeBuffer = await QRCode.toBuffer(link, { type: 'png', width: 300, errorCorrectionLevel: 'H' });
    
            const filePath = join(folderPath, `qr_code_${Date.now()}.png`);
            await writeFile(filePath, qrCodeBuffer);
            this.logger.info(`QR code saved at: ${filePath}`);
    
            return filePath;
        } catch (error) {
            this.logger.error(`Failed to generate QR code: ${error.message}`);
            throw new HttpException('Failed to generate QR code', 500);
        }
    }

    toParticipantResponse(data: ParticipantResponse): ParticipantResponse {
        return {
            ...data,
        };
    }
}
