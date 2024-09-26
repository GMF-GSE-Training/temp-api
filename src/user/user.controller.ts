import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { buildResponse, ListRequest, SearchRequest, WebResponse } from "../model/web.model";
import { CreateUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";
import { CurrentUserRequest } from "src/model/auth.model";

@Controller("/users")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    @Roles('Super Admin', 'supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async create(@Body() req: CreateUserRequest, @Req() user: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.createUser(req, user);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/:userId')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async get(@Param('userId', ParseUUIDPipe) userId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.getUser(userId, user);
        return buildResponse(HttpStatus.OK, result);
    }

    @Patch('/:userId')
    @Roles('Super Admin', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async update(@Param('userId', ParseUUIDPipe) userId: string, @Body() req: UpdateUserRequest, @Req() user: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.updateUser(userId, req, user);
        return buildResponse(HttpStatus.OK, result);
    }

    @Get('/list/result')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async list(
        @Req() user: CurrentUserRequest,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<UserResponse[]>> {
        const query: ListRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.userService.listUsers(query, user);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }

    @Get('/search/result')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async search(
        @Req() user: CurrentUserRequest,
        @Query('q') q: string,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<UserResponse[]>> {
        if(!q) {
            throw new HttpException('Query kosong, data tidak ditemukan', 204);
        }

        const query: SearchRequest = {
            searchQuery: q,
            page: page || 1,
            size: size || 10,
        };
        const result = await this.userService.searchUser(query, user);
        return buildResponse(HttpStatus.OK, result.data, null, result.actions, result.paging);
    }

    @Delete('/:userId')
    @Roles('Super Admin', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async deleteUser(@Param('userId', ParseUUIDPipe) userId: string, @Req() user: CurrentUserRequest): Promise<WebResponse<boolean>> {
        await this.userService.delete(userId, user);
        return buildResponse(HttpStatus.OK, true);
    }
}