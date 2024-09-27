import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { CapabilityService } from "./capability.service";
import { CapabilityResponse, CreateCapability } from "src/model/capability.model";
import { buildResponse, WebResponse } from "src/model/web.model";
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
    async create(@Body() request: CreateCapability): Promise<WebResponse<CapabilityResponse>> {
        console.log(request);
        const result = await this.capabilityService.createCapability(request);
        return buildResponse(HttpStatus.OK, result);
    }
}