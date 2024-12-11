import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Roles } from "src/shared/decorator/role.decorator";
import { AuthGuard } from "src/shared/guard/auth.guard";
import { RoleGuard } from "src/shared/guard/role.guard";
import { CreateESign, ESignResponse } from "src/model/e-sign.model";
import { buildResponse, ListRequest, WebResponse } from "src/model/web.model";
import { ESignService } from "./e-sign.service";

@Controller('e-sign')
export class ESignController {
    constructor(
        private readonly eSignService: ESignService,
    ) { }

    @Post()
    @HttpCode(200)
    @Roles('super admin',)
    @UseGuards(AuthGuard, RoleGuard)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'eSign', maxCount: 1 },
    ]))
    async create(
        @Body() createESign: CreateESign,
        @UploadedFiles() files: {
            eSign: Express.Multer.File[],
        },
    ): Promise<WebResponse<string>> {
        // Validasi ukuran file secara manual
        const maxSize = 2 * 1024 * 1024; // 2 MB

        // Validasi file berdasarkan field
        const fileKeys = ['eSign'];
        
        fileKeys.forEach(field => {
        if (files[field] && files[field][0].size > maxSize) {
            throw new HttpException(`File E-Sign melebihi ukuran maksimum 2MB.`, 400);
        }
        });

        let eSign: CreateESign;
        try {
            eSign = {
                ...createESign,
                signFileName: createESign.signFileName ? createESign.signFileName : 'e-sign.png',
                eSign: files.eSign[0].buffer,
                status: true,
            };
        } catch(error) {
            throw new HttpException('Semua file/image tidak boleh kosong', 400);
        }
        
        const result = await this.eSignService.createESign(eSign);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:eSignId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async get(@Param('eSignId', ParseUUIDPipe) eSignId: string): Promise<any> {
        const result = await this.eSignService.getESign(eSignId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:eSignId/view')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async getESign(@Param('eSignId', ParseUUIDPipe) eSignId: string): Promise<WebResponse<string>> {
        const fileBuffer = await this.eSignService.streamFile(eSignId);
        const result = fileBuffer.toString('base64');
        return buildResponse(HttpStatus.OK, result);
    }

    @Delete('/:eSignId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async delete(@Param('eSignId', ParseUUIDPipe) eSignId: string): Promise<WebResponse<string>> {
        const result = await this.eSignService.deleteESign(eSignId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @Query('page', new ParseIntPipe({ optional: true, exceptionFactory: () => new HttpException('Page must be a positive number', 400) })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true, exceptionFactory: () => new HttpException('Size must be a positive number', 400) })) size?: number,
    ): Promise<WebResponse<ESignResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.eSignService.listESign(query);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }
}