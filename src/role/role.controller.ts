import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { RoleService } from "./role.service";
import { Roles } from "../common/decorator/role.decorator";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { CreateRoleRequest, RoleResponse, UpdateRoleRequest } from "../model/role.model";
import { buildResponse, WebResponse } from "../model/web.model";
import { CurrentUserRequest } from "src/model/auth.model";

@Controller("/roles")
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Post()
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async createRole(@Body() req: CreateRoleRequest): Promise<WebResponse<RoleResponse>> {
        const result = await this.roleService.create(req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:roleId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async getRole(@Param('roleId', ParseUUIDPipe) roleId: string): Promise<WebResponse<RoleResponse>> {
        const result = await this.roleService.get(roleId);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get()
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu')
    @UseGuards(AuthGuard, RoleGuard)
    async getAllRoles(user: CurrentUserRequest): Promise<WebResponse<RoleResponse[]>> {
        const result = await this.roleService.getAllRole(user);
        return buildResponse(HttpStatus.OK, result);
    }

    @Patch('/:roleId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async updateRole(@Param('roleId', ParseUUIDPipe) roleId: string, @Body() req: UpdateRoleRequest): Promise<WebResponse<RoleResponse>> {
        const result = await this.roleService.update(roleId, req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Delete('/:roleId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async deleteRole(@Param('roleId', ParseUUIDPipe) roleId: string): Promise<WebResponse<boolean>> {
        await this.roleService.delete(roleId);
        return buildResponse(HttpStatus.OK, true);
    }
}