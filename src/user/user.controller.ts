import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { WebResponse } from "src/model/web.model";
import { RegisterUserRequest, UserResponse } from "src/model/user.model";

@Controller("/users")
export class UserController {
    constructor(private userService: UserService) {}

    @Post()
    async register(@Body() req: RegisterUserRequest): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(req);
        return{
            data: result,
        }
    }
}