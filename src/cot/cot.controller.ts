import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { CotResponse, CreateCOT } from "src/model/cot.model";
import { buildResponse, ListRequest, WebResponse } from "src/model/web.model";
import { CotService } from "./cot.service";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";

@Controller('/cot')
export class CotController {
    constructor(private readonly cotService: CotService) { }

    @Post()
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async create(@Body() request: CreateCOT): Promise<WebResponse<string>> {
        const result = await this.cotService.createCot(request);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:cotId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async get(@Param('cotId', ParseUUIDPipe) cotId: string): Promise<WebResponse<CotResponse>> {
        const result = await this.cotService.getCot(cotId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<CotResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.cotService.listCot(query);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }
}