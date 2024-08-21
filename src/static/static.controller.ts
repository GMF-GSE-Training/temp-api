import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { StaticService } from "./static.service";
import { join } from "path";
import { createReadStream } from "fs";
import { Response } from "express";
import { Roles } from "src/common/decorator/role.decorator";
import { AuthGuard } from "src/common/guard/auth.guard";
import { RoleGuard } from "src/common/guard/role.guard";


@Controller("/files")
export class StaticController {
    constructor(private readonly staticService: StaticService) {}

    @Get('/:fileName')
    @HttpCode(200)
    @Roles('super admin', 'supervisor', 'lcu', 'user')
    @UseGuards(AuthGuard, RoleGuard)
    async getFile(@Param('fileName') fileName: string, @Res() res: Response) {
        console.log(fileName);
        return this.staticService.getFile(fileName, res);
    }
}