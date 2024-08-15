import { Body, Controller, HttpCode, HttpException, HttpStatus, Post, Request, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { ParticipantResponse } from "../model/participant.model";
import { buildResponse, WebResponse } from "../model/web.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { extname } from 'path';
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";

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
        { name: 'surat_bebas_narkoba', maxCount: 1 }
    ]))
    async createParticipant(@Request() req: any, @UploadedFiles() files: Record<string, Express.Multer.File[]>): Promise<WebResponse<ParticipantResponse>> {
        try {
            const allowedExtensions = ['.png', '.jpg', '.jpeg'];
            for (const [key, fileArray] of Object.entries(files)) {
                const file = fileArray[0];
                const fileExtension = extname(file.originalname).toLowerCase();
    
                if (!allowedExtensions.includes(fileExtension)) {
                    throw new HttpException(`Invalid file format for ${key}. Only PNG, JPG, and JPEG are allowed.`, 400);
                }
            }
    
            const result = await this.participantService.create(req.body, files);
    
            return buildResponse(HttpStatus.OK, result);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            return buildResponse(statusCode, null, error.response);
        }
    }
}
