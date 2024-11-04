import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, ParseIntPipe, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { CreateESign, ESignResponse } from "src/model/e-sign.model";
import { buildResponse, ListRequest, WebResponse } from "src/model/web.model";
import { ESignService } from "./e-sign.service";

@Controller('e-sign')
export class ESignController {
    constructor(private readonly eSignService: ESignService) { }

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
        let eSign: CreateESign;
        try {
            eSign = {
                ...createESign,
                eSignFileName: createESign.eSignFileName ? createESign.eSignFileName : 'e-sign.png',
                eSign: files.eSign[0].buffer,
                status: true,
            };
        } catch(error) {
            throw new HttpException('Semua file/image tidak boleh kosong', 400);
        }
        
        const result = await this.eSignService.createESign(eSign);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<ESignResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.eSignService.listESign(query);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }
}