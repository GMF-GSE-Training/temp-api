import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { RoleService } from "./role.service";
import { Roles } from "../common/decorator/role.decorator";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { CreateRoleRequest, RoleResponse, UpdateRoleRequest } from "../model/role.model";
import { buildResponse, WebResponse } from "../model/web.model";

@Controller("/roles")
export class RoleController {
    constructor(private roleService: RoleService) {}

    @Post()
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async createRole(@Body() req: CreateRoleRequest): Promise<WebResponse<RoleResponse>> {
        const result = await this.roleService.create(req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get()
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async getAllRoles(): Promise<WebResponse<RoleResponse[]>> {
        const result = await this.roleService.getAll();
        return buildResponse(HttpStatus.OK, result);
    }

    @Patch('/:roleId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async updateRole(@Param('roleId', ParseIntPipe) roleId: number, @Body() req: UpdateRoleRequest): Promise<WebResponse<RoleResponse>> {
        const result = await this.roleService.update(roleId, req);
        return buildResponse(HttpStatus.OK, result);
    }

    @Delete('/:roleId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async deleteRole(@Param('roleId', ParseIntPipe) roleId: number): Promise<WebResponse<boolean>> {
        await this.roleService.delete(roleId);
        return buildResponse(HttpStatus.OK, true);
    }
}