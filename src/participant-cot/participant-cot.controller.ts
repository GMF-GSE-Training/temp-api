import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";import { ParticipantCotService } from "./participant-cot.service";
import { Roles } from "src/shared/decorator/role.decorator";
import { AuthGuard } from "src/shared/guard/auth.guard";
import { RoleGuard } from "src/shared/guard/role.guard";
import { buildResponse, ListRequest, SearchRequest, WebResponse } from "src/model/web.model";
import { addParticipantToCot, ParticipantCotResponse } from "src/model/participant-cot.model";
import { User } from "src/shared/decorator/user.decorator";
import { CurrentUserRequest } from "src/model/auth.model";
import { ListParticipantResponse } from "src/model/participant.model";

@Controller('/participant-cot')
export class ParticipantCotController {
    constructor(private readonly participantCotService: ParticipantCotService) { }

    @Get('/unregistered/:cotId')
    @HttpCode(200)
    @Roles('super admin', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getUnregisteredParticipants(
        @Param('cotId', ParseUUIDPipe) cotId: string,
        @User() user: CurrentUserRequest,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<ListParticipantResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.participantCotService.getUnregisteredParticipants(cotId, user, query);
        return buildResponse(HttpStatus.OK, result.data, null, null, result.paging);
    }

    @Post('/:cotId')
    @HttpCode(200)
    @Roles('super admin', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async addParticipantToCot(
        @Param('cotId', ParseUUIDPipe) cotId: string,
        @User() user: CurrentUserRequest,
        @Body() request: addParticipantToCot
    ): Promise<WebResponse<string>> {
        const result = await this.participantCotService.addParticipantToCot(cotId, user, request);
        return buildResponse(HttpStatus.OK, result);
    }

    @Delete('/:cotId/:participantId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async deleteParticipantFromCot(@Param('cotId', ParseUUIDPipe) cotId: string, @Param('participantId', ParseUUIDPipe) participantId: string): Promise<WebResponse<string>> {
        const result = await this.participantCotService.deleteParticipantFromCot(participantId, cotId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:cotId/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async listParticipantCot(
        @Param('cotId', ParseUUIDPipe) cotId: string,
        @User() user: CurrentUserRequest,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<ParticipantCotResponse>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.participantCotService.listParticipantsCot(cotId, user, query);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:cotId/search/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async searchParticipantCot(
        @Param('cotId', ParseUUIDPipe) cotId: string,
        @User() user: CurrentUserRequest,
        @Query('q') q: string,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<ParticipantCotResponse>> {
        const query: SearchRequest = {
            searchQuery: q,
            page: page || 1,
            size: size || 10,
        };
        const result = await this.participantCotService.searchParticipantCot(cotId, user, query);
        return buildResponse(HttpStatus.OK, result);
    }
}