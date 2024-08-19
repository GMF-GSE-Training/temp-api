import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { buildResponse, WebResponse } from "../model/web.model";
import { ListUserRequest, SearchUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";
import { error } from "console";

@Controller("/users")
export class UserController {
    constructor(private userService: UserService) {}

    @Post('/register')
    @HttpCode(200)
    async register(@Body() req: any): Promise<WebResponse<UserResponse>> {
        try {
            const result = await this.userService.register(req);
            return buildResponse(HttpStatus.OK, result);
        } catch (error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }

    @Post('/create')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async createUser(@Body() req: any): Promise<WebResponse<UserResponse>> {
        try {
            const result = await this.userService.create(req);
            return buildResponse(HttpStatus.OK, result);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }

    @Get('/:userId')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async getUser(@Param('userId', ParseIntPipe) userId: number): Promise<WebResponse<UserResponse>> {
        try {
            const result = await this.userService.get(userId);
            return buildResponse(HttpStatus.OK, result);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }

    @Patch('/:userId')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async updateUser(@Param('userId', ParseIntPipe) userId: number, @Body() req: UpdateUserRequest): Promise<WebResponse<UserResponse>> {
        try {
            req.id = userId;
            const result = await this.userService.update(req);
            return buildResponse(HttpStatus.OK, result);
        } catch(error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }

    @Get('/list/result')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async listUsers(
        @Req() request: any,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('size', new ParseIntPipe({ optional: true })) size?: number,
    ): Promise<WebResponse<UserResponse[]>> {
        try {
            const query: ListUserRequest = { 
                page: page || 1,
                size: size || 10,
            };
            const result = await this.userService.list(query, request.user);
            return buildResponse(HttpStatus.OK, result.data, null, result.paging);
        } catch (error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
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
        try {
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
        } catch (error) {
            const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
            throw new HttpException(error.response || 'Internal Server Error', statusCode);
        }
    }
}