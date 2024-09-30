import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { CurriculumSyllabusService } from "./curriculum-syllabus.service";
import { CreateCurriculumSyllabus } from "src/model/curriculum-syllabus.model";
import { buildResponse, ListRequest, WebResponse } from "src/model/web.model";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";

@Controller('/curriculum-syllabus')
export class CurriculumSyllabusController {
    constructor(private readonly curriculumSyllabusService: CurriculumSyllabusService) { }

    @Post()
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async create(@Body() request: CreateCurriculumSyllabus): Promise<WebResponse<any>> {
        console.log(request);
        const result = await this.curriculumSyllabusService.createCurriculumSyllabus(request);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:curriculumSyllabusId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async get(@Param('curriculumSyllabusId', ParseUUIDPipe) curriculumSyllabusId: string) {
        const result = await this.curriculumSyllabusService.getCurriculumSyllabus(curriculumSyllabusId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ) {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.curriculumSyllabusService.listCurriculumSyllabus(query);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }
}