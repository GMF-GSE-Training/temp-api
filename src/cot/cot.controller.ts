import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CotResponse, CreateCot, UpdateCot } from "src/model/cot.model";
import { buildResponse, ListRequest, SearchRequest, WebResponse } from "src/model/web.model";
import { CotService } from "./cot.service";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { CurrentUserRequest } from "src/model/auth.model";

@Controller('/cot')
export class CotController {
    constructor(private readonly cotService: CotService) { }

    @Post()
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async create(@Body() request: CreateCot): Promise<WebResponse<string>> {
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

    @Patch('/:cotId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async update(@Param('cotId', ParseUUIDPipe) cotId: string, @Body() request: UpdateCot): Promise<WebResponse<string>> {
        request.startDate =  request.startDate ? new Date(request.startDate) : undefined;
        request.endDate =  request.endDate ? new Date(request.endDate) : undefined;
        const result = await this.cotService.updateCot(cotId, request);
        return buildResponse(HttpStatus.OK, result);
    }

    // @Get('/participant-cot/:cotId/unregistered/result')
    // @HttpCode(200)
    // @Roles('super admin', 'supervisor', 'lcu', 'user')
    // @UseGuards(AuthGuard, RoleGuard)
    // async getUnregisteredParticipants(
    //     @Param('cotId', ParseUUIDPipe) cotId: string,
    //     @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    //     @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    // ): Promise<WebResponse<any[]>> {
    //     const query: ListRequest = { 
    //         page: page || 1,
    //         size: size || 10,
    //     };
    //     const result = await this.cotService.getUnregisteredParticipants(cotId, query);
    //     return buildResponse(HttpStatus.OK, result.data, null, null, result.paging);
    // }

    // @Post('participant-cot/:cotId')
    // @HttpCode(200)
    // @Roles('super admin')
    // @UseGuards(AuthGuard, RoleGuard)
    // async addParticipantToCot(@Param('cotId', ParseUUIDPipe) cotId: string, @Body('participantIds') participantIds: string[]): Promise<WebResponse<string>> {
    //     const result = await this.cotService.addParticipantToCot(cotId, participantIds);
    //     return buildResponse(HttpStatus.OK, result);
    // }

    // @Get('/participant-cot/:cotId')
    // @HttpCode(200)
    // @Roles('super admin', 'supervisor', 'lcu', 'user')
    // @UseGuards(AuthGuard, RoleGuard)
    // async getParticipantCot(
    //     @Param('cotId', ParseUUIDPipe) cotId: string,
    //     @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    //     @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    // ): Promise<WebResponse<any>> {
    //     const query: ListRequest = { 
    //         page: page || 1,
    //         size: size || 10,
    //     };
    //     const result = await this.cotService.getParticipantsCot(cotId, query);
    //     return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    // }

    // @Delete('/participant-cot/:cotId/:participantId')
    // @HttpCode(200)
    // @Roles('super admin')
    // @UseGuards(AuthGuard, RoleGuard)
    // async deleteParticipantFromCot(@Param('cotId', ParseUUIDPipe) cotId: string, @Param('participantId', ParseUUIDPipe) participantId: string): Promise<WebResponse<string>> {
    //     const result = await this.cotService.deleteParticipantFromCot(participantId, cotId);
    //     return buildResponse(HttpStatus.OK, result);
    // }

    @Delete('/:cotId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async delete(@Param('cotId', ParseUUIDPipe) cotId: string): Promise<WebResponse<string>> {
        const result = await this.cotService.deleteCot(cotId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @Req() user: CurrentUserRequest,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<CotResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.cotService.listCot(user, query);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }

    // @Get('/search/result')
    // @HttpCode(200)
    // @Roles('super admin', 'supervisor', 'lcu', 'user')
    // @UseGuards(AuthGuard, RoleGuard)
    // async search(
    //     @Req() user: CurrentUserRequest,
    //     @Query('q') q: string,
    //     @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    //     @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    // ): Promise<WebResponse<CotResponse[]>> {
    //     const query: SearchRequest = {
    //         searchQuery: q,
    //         page: page || 1,
    //         size: size || 10,
    //     };

    //     const result = await this.cotService.searchCot(query, user);
    //     return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    // }
}