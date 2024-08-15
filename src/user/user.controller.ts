import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { buildResponse, WebResponse } from "../model/web.model";
import { UpdateUserRequest, UserResponse } from "../model/user.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";

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
            return buildResponse(statusCode, null, error.response);
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
            return buildResponse(statusCode, null, error.response);
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
            return buildResponse(statusCode, null, error.response);
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
            return buildResponse(statusCode, null, error.response);
        }
    }
}