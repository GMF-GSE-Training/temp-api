import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, Res, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { CreateParticipantRequest, ParticipantResponse, UpdateParticipantRequest } from "../model/participant.model";
import { buildResponse, ListRequest, SearchRequest, WebResponse } from "../model/web.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";
import { Response } from "express";
import { CurrentUserRequest } from "src/model/auth.model";

@Controller('/participants')
export class ParticipantController {
    constructor(private participantService: ParticipantService) {}

    @Post()
    @HttpCode(200)
    @Roles('super admin', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'sim_a', maxCount: 1 },
        { name: 'sim_b', maxCount: 1 },
        { name: 'ktp', maxCount: 1 },
        { name: 'foto', maxCount: 1 },
        { name: 'surat_sehat_buta_warna', maxCount: 1 },
        { name: 'surat_bebas_narkoba', maxCount: 1 },
    ]))
    async create(
        @Req() user: CurrentUserRequest,
        @Body() createParticipantDto: CreateParticipantRequest,
        @UploadedFiles() files: {
            sim_a?: Express.Multer.File[],
            sim_b?: Express.Multer.File[],
            ktp?: Express.Multer.File[],
            foto?: Express.Multer.File[],
            surat_sehat_buta_warna?: Express.Multer.File[],
            surat_bebas_narkoba?: Express.Multer.File[],
        },
    ): Promise<WebResponse<ParticipantResponse>> {
        let participantData: CreateParticipantRequest;
        try {
            participantData = {
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
        } catch(error) {
            throw new HttpException('Semua file/image tidak boleh kosong', 400);
        }
        
        const participant = await this.participantService.createParticipant(participantData, user);
        return buildResponse(HttpStatus.OK, participant);
    }

    @Patch('/:participantId')
    @HttpCode(200)
    @Roles('super admin', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
        { name: 'sim_a', maxCount: 1 },
        { name: 'sim_b', maxCount: 1 },
        { name: 'ktp', maxCount: 1 },
        { name: 'foto', maxCount: 1 },
        { name: 'surat_sehat_buta_warna', maxCount: 1 },
        { name: 'surat_bebas_narkoba', maxCount: 1 },
    ]))
    async update(
        @Param('participantId', ParseUUIDPipe) participantId: string,
        @Body() req: Omit<UpdateParticipantRequest, 'sim_a' | 'sim_b' | 'ktp' | 'foto' | 'surat_sehat_buta_warna' | 'surat_bebas_narkoba'>,
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
            ...req,
            tanggal_lahir: req.tanggal_lahir ? new Date(req.tanggal_lahir) : undefined,
            exp_surat_sehat: req.exp_surat_sehat ? new Date(req.exp_surat_sehat) : undefined,
            exp_bebas_narkoba: req.exp_bebas_narkoba ? new Date(req.exp_bebas_narkoba) : undefined,
            sim_a: files?.sim_a?.[0]?.buffer || undefined,
            sim_b: files?.sim_b?.[0]?.buffer || undefined,
            ktp: files?.ktp?.[0]?.buffer || undefined,
            foto: files?.foto?.[0]?.buffer || undefined,
            surat_sehat_buta_warna: files?.surat_sehat_buta_warna?.[0]?.buffer || undefined,
            surat_bebas_narkoba: files?.surat_bebas_narkoba?.[0]?.buffer || undefined,
        };

        const participant = await this.participantService.updateParticipant(participantId, participantData);
        return buildResponse(HttpStatus.OK, participant);
    }

    @Get('/:participantId/sim-a')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getSimA(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<string>> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'sim_a', user);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId/sim-b')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getSimB(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<string>> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'sim_b', user);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId/foto')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async getFoto(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<string>> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'foto', user);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId/ktp')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getKTP(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<string>> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'ktp', user);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId/surat-sehat-buta-warna')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getSuratSehat(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<string>> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'surat_sehat_buta_warna', user);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId/surat-bebas-narkoba')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getSuratKetBebasNarkoba(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<string>> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'surat_bebas_narkoba', user);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId/qr-code')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getQrCode(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<string>> {
        const fileBuffer = await this.participantService.streamFile(participantId, 'qr_code', user);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async get(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<ParticipantResponse>> {
        const result = await this.participantService.getParticipant(participantId, user);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:participantId/id-card')
    @Roles('super admin', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async downloadIdCard(@Param('participantId', ParseUUIDPipe) participantId: string, @Res() res: Response): Promise<void> {
        try {
            const pdfBuffer = await this.participantService.downloadIdCard(participantId);

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename="id-card.pdf"',
                'Content-Length': pdfBuffer.length,
            });

            res.send(pdfBuffer);
        } catch (error) {
            throw new HttpException(error.message, error.status || 500);
        }
    }

    @Delete('/:participantId')
    @HttpCode(200)
    @Roles('super admin', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async delete(@Param('participantId', ParseUUIDPipe) participantId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<boolean>> {
        await this.participantService.deleteParticipant(participantId, user);
        return buildResponse(HttpStatus.OK, true);
    }

    @Get('/list/result')
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @Req() user: CurrentUserRequest,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<ParticipantResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.participantService.listParticipants(query, user);
        return buildResponse(HttpStatus.OK, result.data, null, result.paging);
    }

    @Get('/search/result')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async search(
        @Req() user: CurrentUserRequest,
        @Query('q') q: string,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<ParticipantResponse[]>> {
        if(!q) {
            throw new HttpException('Query kosong, data tidak ditemukan', 204);
        }

        const query: SearchRequest = {
            searchQuery: q,
            page: page || 1,
            size: size || 10,
        };
        const result = await this.participantService.searchParticipant(query, user);
        return buildResponse(HttpStatus.OK, result.data, null, result.paging);
    }
}
