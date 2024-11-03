import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CapabilityService } from "./capability.service";
import { CreateCapability, UpdateCapability } from "src/model/capability.model";
import { buildResponse, ListRequest, SearchRequest, WebResponse } from "src/model/web.model";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";
import { CurrentUserRequest } from "src/model/auth.model";

@Controller('/capability')
export class CapabilityController {
    constructor(private readonly capabilityService: CapabilityService) { }

    @Post()
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async create(@Body() request: CreateCapability): Promise<WebResponse<any>> {
        const result = await this.capabilityService.createCapability(request);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:capabilityId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async get(@Param('capabilityId', ParseUUIDPipe) capabilityId: string) {
        const result = await this.capabilityService.getCapability(capabilityId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Patch('/:capabilityId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async update(@Param('capabilityId', ParseUUIDPipe) capabilityId: string, @Body() req: UpdateCapability): Promise<WebResponse<string>> {
        console.log(req);
        const result  = await this.capabilityService.updateCapability(capabilityId, req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Delete('/:capabilityId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async delete(@Param('capabilityId', ParseUUIDPipe) capabilityId: string): Promise<WebResponse<string>> {
        const result = await this.capabilityService.deleteCapability(capabilityId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<any[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.capabilityService.listCapability(query);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }

    @Get('/search/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async search(
        @Req() user: CurrentUserRequest,
        @Query('q') q: string,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<any[]>> {
        const query: SearchRequest = {
            searchQuery: q,
            page: page || 1,
            size: size || 10,
        };

        const result = await this.capabilityService.searchCapability(query, user);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }
}