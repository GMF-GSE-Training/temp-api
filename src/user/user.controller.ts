import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Req } from "@nestjs/common";
import { UserService } from "./user.service";
import { WebResponse } from "src/model/web.model";
import { RegisterUserRequest, UserResponse } from "../model/user.model";

@Controller("/users")
export class UserController {
    constructor(private userService: UserService) {}

    @Post()
    @HttpCode(200)
    async register(@Body() req: RegisterUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(req);
        return{
            data: result,
        }
    }
}