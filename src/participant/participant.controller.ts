import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Res, StreamableFile, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { CreateParticipantRequest, ParticipantResponse } from "../model/participant.model";
import { buildResponse, WebResponse } from "../model/web.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";
import { Response } from "express";

@Controller('/participants')
export class ParticipantController {
    constructor(private participantService: ParticipantService) {}

    @Post()
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'sim_a', maxCount: 1 },
        { name: 'sim_b', maxCount: 1 },
        { name: 'ktp', maxCount: 1 },
        { name: 'foto', maxCount: 1 },
        { name: 'surat_sehat_buta_warna', maxCount: 1 },
        { name: 'surat_bebas_narkoba', maxCount: 1 },
    ]))
    async createParticipant(
        @Body() createParticipantDto: Omit<CreateParticipantRequest, 'sim_a' | 'sim_b' | 'ktp' | 'foto' | 'surat_sehat_buta_warna' | 'surat_bebas_narkoba'>,
        @UploadedFiles() files: {
            sim_a?: Express.Multer.File[],
            sim_b?: Express.Multer.File[],
            ktp?: Express.Multer.File[],
            foto?: Express.Multer.File[],
            surat_sehat_buta_warna?: Express.Multer.File[],
            surat_bebas_narkoba?: Express.Multer.File[],
        }
    ): Promise<WebResponse<ParticipantResponse>> {

        const participantData = {
            ...createParticipantDto,
            tanggal_lahir: new Date(createParticipantDto.tanggal_lahir),
            exp_surat_sehat: new Date(createParticipantDto.exp_surat_sehat),
            exp_bebas_narkoba: new Date(createParticipantDto.exp_bebas_narkoba),
            sim_a: files.sim_a ? files.sim_a[0].buffer : null,
            sim_b: files.sim_b ? files.sim_b[0].buffer : null,
            ktp: files.ktp ? files.ktp[0].buffer : null,
            foto: files.foto ? files.foto[0].buffer : null,
            surat_sehat_buta_warna: files.surat_sehat_buta_warna ? files.surat_sehat_buta_warna[0].buffer : null,
            surat_bebas_narkoba: files.surat_bebas_narkoba ? files.surat_bebas_narkoba[0].buffer : null,
        };
        
        const participant = await this.participantService.createParticipant(participantData);
        console.log(participant)
        return buildResponse(HttpStatus.OK, participant);
    }

    @Get('sim-a/:participantId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getSimA(@Param('participantId', ParseIntPipe) participantId: number): Promise<StreamableFile> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'sim_a');
        return new StreamableFile(fileBuffer);
    }
}
