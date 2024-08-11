import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { WebResponse } from "src/model/web.model";
import { RegisterUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { AuthGuard } from "../common/guard/auth.guard";
import { RoleGuard } from "../common/guard/role.guard";
import { Roles } from "../common/decorator/role.decorator";

@Controller("/users")
export class UserController {
    constructor(private userService: UserService) {}

    @Post('/register')
    @HttpCode(200)
    async register(@Body() req: RegisterUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(req);
        return{
            data: result,
        }
    }

    @Post('/create')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async createUser(@Body() req: RegisterUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(req);
        return{
            data: result,
        }
    }

    @Get('/:userId')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async getUserById(@Param('userId', ParseIntPipe) userId: number): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.getUserById(userId);
        return{
            data: result,
        }
    }

    @Patch('/:userId')
    @Roles('Super Admin', 'Supervisor', 'LCU')
    @UseGuards(AuthGuard, RoleGuard)
    @HttpCode(200)
    async updateUser(@Param('userId', ParseIntPipe) userId: number, @Body() req: UpdateUserRequest): Promise<WebResponse<UserResponse>> {
        req.id = userId;
        const result = await this.userService.updateUser(req);
        return{
            data: result,
        }
    }
}