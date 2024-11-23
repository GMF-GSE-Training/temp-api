import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { RoleResponse } from "src/model/role.model";

@Injectable()
export class UserHelper {
    constructor(private prismaService: PrismaService) {}

    async findRoleUser(): Promise<RoleResponse> {
        const roleUser = await this.prismaService.role.findFirst({
            where: { 
                name: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });
        return roleUser;
    }
}