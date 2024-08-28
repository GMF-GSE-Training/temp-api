import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { buildResponse, WebResponse } from "../model/web.model";
import { CreateUserRequest, ListUserRequest, SearchUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";
import { CurrentUserRequest } from "src/model/auth.model";

@Controller("/users")
export class UserController {
    constructor(private userService: UserService) {}

    @Post('/create')
    @Roles('Super Admin', 'LCU')
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
    async get(@Param('userId', ParseIntPipe) userId: number, @Req() user: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.getUser(userId, user);
        return buildResponse(HttpStatus.OK, result);
    }

    @Patch('/:userId')
    @Roles('Super Admin', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async update(@Param('userId', ParseIntPipe) userId: number, @Body() req: UpdateUserRequest, @Req() user: CurrentUserRequest): Promise<WebResponse<UserResponse>> {
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
        const query: ListUserRequest = { 
            page: page || 1,
            size: size || 10,
        };
        const result = await this.userService.listUsers(query, user);
        return buildResponse(HttpStatus.OK, result.data, null, result.paging);
    }

    @Get('/search/result')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async searchUser(
        @Req() request: any,
        @Query('q') q: string,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<UserResponse[]>> {
        if(!q) {
            throw new HttpException('Search query tidak boleh kosong', 400);
        }

        const query: SearchUserRequest = {
            searchQuery: q,
            page: page || 1,
            size: size || 10,
        };
        const result = await this.userService.search(query, request.user);
        return buildResponse(HttpStatus.OK, result.data, null, result.paging);
    }

    @Delete('/:userId')
    @Roles('Super Admin', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async deleteUser(@Param('userId', ParseIntPipe) userId: number): Promise<WebResponse<boolean>> {
        await this.userService.delete(userId);
        return buildResponse(HttpStatus.OK, true);
    }
}