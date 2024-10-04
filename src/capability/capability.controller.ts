import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { CapabilityService } from "./capability.service";
import { CreateCapability } from "src/model/capability.model";
import { buildResponse, ListRequest, WebResponse } from "src/model/web.model";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";

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
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async get(@Param('capabilityId', ParseUUIDPipe) capabilityId: string) {
        const result = await this.capabilityService.getCapability(capabilityId);
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
}