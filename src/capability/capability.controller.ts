import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CapabilityService } from "./capability.service";
import { CapabilityResponse, CreateCapability, UpdateCapability } from "src/model/capability.model";
import { buildResponse, ListRequest, SearchRequest, WebResponse } from "src/model/web.model";
import { Roles } from "src/shared/decorator/role.decorator";
import { AuthGuard } from "src/shared/guard/auth.guard";
import { RoleGuard } from "src/shared/guard/role.guard";
import { CurrentUserRequest } from "src/model/auth.model";
import { User } from "src/shared/decorator/user.decorator";

@Controller('/capability')
export class CapabilityController {
    constructor(private readonly capabilityService: CapabilityService) { }

    @Post()
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async create(@Body() request: CreateCapability): Promise<WebResponse<CapabilityResponse>> {
        const result = await this.capabilityService.createCapability(request);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:capabilityId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async get(@Param('capabilityId', ParseUUIDPipe) capabilityId: string): Promise<WebResponse<CapabilityResponse>> {
        const result = await this.capabilityService.getCapability(capabilityId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Patch('/:capabilityId')
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async update(@Param('capabilityId', ParseUUIDPipe) capabilityId: string, @Body() req: UpdateCapability): Promise<WebResponse<string>> {
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

    @Get()
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async getAll(): Promise<WebResponse<CapabilityResponse[]>> {
        const result = await this.capabilityService.getAllCapability();
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async list(
        @User() user: CurrentUserRequest,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<CapabilityResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.capabilityService.listCapability(user, query);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }

    @Get('/search/result')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async search(
        @User() user: CurrentUserRequest,
        @Query('q') q: string,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<CapabilityResponse[]>> {
        const query: SearchRequest = {
            searchQuery: q,
            page: page || 1,
            size: size || 10,
        };

        const result = await this.capabilityService.searchCapability(query, user);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }
}