import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { CreateCOT } from "src/model/cot.model";
import { buildResponse, WebResponse } from "src/model/web.model";
import { CotService } from "./cot.service";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";

@Controller('/cot')
export class CotController {
    constructor(private readonly cotService: CotService) { }

    @Post()
    @HttpCode(200)
    @Roles('super admin')
    @UseGuards(AuthGuard, RoleGuard)
    async create(@Body() request: CreateCOT): Promise<WebResponse<string>> {
        const result = await this.cotService.createCot(request);
        return buildResponse(HttpStatus.OK, result);
    }

    
}