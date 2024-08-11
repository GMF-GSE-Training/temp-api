import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { DinasService } from "./dinas.service";
import { CreateDinasRequest, DinasResponse } from "../model/dinas.model";
import { WebResponse } from "../model/web.model";
import { Roles } from "../common/decorator/role.decorator";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";

@Controller('/dinas')
export class DinasController {
    constructor(private dinasService: DinasService) {}

    @Post()
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async create(@Body() req: CreateDinasRequest): Promise<WebResponse<DinasResponse>> {
        const result = await this.dinasService.create(req);
        return {
            data: result,
        }
    }

    @Get()
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async getAll(): Promise<WebResponse<DinasResponse[]>> {
        const result = await this.dinasService.getAll();
        return {
            data: result,
        }
    }

    @Delete('/:dinasId')
    @HttpCode(200)
    @Roles('super admin', 'supervisor')
    @UseGuards(AuthGuard, RoleGuard)
    async delete(@Param('dinasId', ParseIntPipe) dinasId: number): Promise<WebResponse<boolean>> {
        await this.dinasService.delete(dinasId);

        return {
            data: true,
        }
    }
}