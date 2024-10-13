import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { CreateUserRequest, UpdateUserRequest, UserList, UserResponse } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { ActionAccessRights, ListRequest, Paging, SearchRequest } from "src/model/web.model";
import { CurrentUserRequest } from "src/model/auth.model";
import { RoleResponse } from "src/model/role.model";

@Injectable()
export class UserService {
    constructor(
        private readonly validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private readonly prismaService: PrismaService,
    ) {}

    async createUser(req: CreateUserRequest, user: CurrentUserRequest): Promise<UserResponse> {
        if(!req.roleId) {
            throw new HttpException('Role tidak boleh kosong', 404);
        }

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

        const roleUser = await this.findRoleUser();

        const role = await this.prismaService.role.findUnique({
            where: {
                id: req.roleId
            }
        });

        if(!role) {
            throw new HttpException('Role tidak valid', 400);
        }

        const roleRequest = role.role.toLowerCase();

        if (roleRequest === 'user') {
            this.validateNikForUser(req);
            await this.validateParticipantNik(req.nik);
        } else if (roleRequest === 'lcu') {
            this.validateNikForNonUserRoles(req.nik);
            this.validateDinas(req.dinas);
        } else if(roleRequest === 'supervisor') {
            this.validateNikForNonUserRoles(req.nik);
            this.validateDinas(req.dinas);
        } else {
            this.validateNikForNonUserRoles(req.nik);
            this.validateDinasForSuperAdmin(req.dinas);
        }

        if(userRole === 'lcu') {
            this.validateRoleForLcuOrSupervisorRequest(req.roleId, roleUser.id);
            this.validateDinasForLcuRequest(req.dinas, user.user.dinas);
        } else if(userRole === 'supervisor') {
            this.validateRoleForLcuOrSupervisorRequest(req.roleId, roleUser.id);
        }

        const createRequest: CreateUserRequest = this.validationService.validate(UserValidation.CREATE, req);

        await this.checkUserExists(createRequest.noPegawai, createRequest.email);

        createRequest.password = await bcrypt.hash(createRequest.password, 10);

        const userSelectFields = this.userSelectFields();

        const createUser = await this.prismaService.user.create({
                data: {
                    ...createRequest,
                    emailVerified: true,
                },
                select: userSelectFields,
        });

        const result: UserResponse = {
            ...createUser,
        }
        
        return this.toUserResponse(result, userRole);
    }

    async getUser(userId: string, user: CurrentUserRequest): Promise<UserResponse> {
        const findUser = await this.findUser(userId);
        if(!findUser) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();
        const roleUser = await this.findRoleUser();

        if(userRole === 'lcu') {
            this.validateRoleForLcuOrSupervisorRequest(findUser.roleId, roleUser.id);
            this.validateDinasForLcuRequest(findUser.dinas, user.user.dinas);
        }

        const result: UserResponse = {
            ...findUser,
        }
        
        return this.toUserResponse(result, userRole);
    }

    async updateUser(userId: string, req: UpdateUserRequest, user: CurrentUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.register(${JSON.stringify(req)})`);

        const findUser = await this.findUser(userId);
        if(!findUser) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        const roleUser = await this.findRoleUser();
        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

        if(userRole === 'lcu') {
            if(req.roleId) {
                this.validateRoleForLcuOrSupervisorRequest(req.roleId, roleUser.id);
            }
            if(req.dinas) {
                this.validateDinasForLcuRequest(req.dinas, user.user.dinas);
            }
        } else if(userRole === 'supervisor') {
            if(req.roleId) {
                this.validateRoleForLcuOrSupervisorRequest(req.roleId, roleUser.id);
            }
        }

        const updateRequest: UpdateUserRequest = this.validationService.validate(UserValidation.UPDATE, req);

        for (const key of Object.keys(updateRequest)) {
            if (updateRequest[key] !== undefined) {
                if (key === 'password') {
                    updateRequest.password = await bcrypt.hash(updateRequest.password, 10);
                } else {
                    (updateRequest as any)[key] = updateRequest[key];
                }
            }
        }

        const userSelectFields = this.userSelectFields();

        const updateUser = await this.prismaService.user.update({
            where: {
                id: userId,
            },
            data: updateRequest,
            select: userSelectFields,
        });
        
        const result: UserResponse = {
            ...updateUser,
        }
        
        return this.toUserResponse(result, userRole);
    }

    async delete(userId: string, user: CurrentUserRequest): Promise<UserResponse> {
        const findUser = await this.findUser(userId);

        if(!findUser) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();
        const roleUser = await this.findRoleUser();

        if(userRole === 'lcu') {
            this.validateRoleForLcuOrSupervisorRequest(findUser.roleId, roleUser.id);
            this.validateDinasForLcuRequest(findUser.dinas, user.user.dinas);
        }

        const deleteUser = await this.prismaService.user.delete({
            where: {
                id: userId,
            }
        });

        console.log(deleteUser);

        const result: UserResponse = {
            id: deleteUser.id,
            noPegawai: deleteUser.noPegawai,
            email: deleteUser.email,
            name: deleteUser.name,
            dinas: deleteUser.dinas,
            roleId: deleteUser.roleId,
        }

        return this.toUserResponse(result, userRole);
    }

    async listUsers(req: ListRequest, user: CurrentUserRequest):Promise<{ data: UserResponse[], actions: ActionAccessRights, paging: Paging }> {
        const listRequest: ListRequest = this.validationService.validate(UserValidation.LIST, req);
        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();

        let users: UserList[];

        const userSelectFields = this.userSelectFields();

        if (userRole === 'supervisor' || userRole === 'super admin') {
            users = await this.prismaService.user.findMany({
                select: userSelectFields,
            });
        } else if (userRole === 'lcu') {
            users = await this.prismaService.user.findMany({
                where: {
                    role: {
                        role: {
                            equals: 'user',
                            mode: 'insensitive',
                        },
                    },
                    dinas: user.user.dinas,
                },
                select: userSelectFields,
            });
        } else {
            throw new HttpException('Forbidden', 403);
        }

        const totalUsers = users.length;
        const totalPage = Math.ceil(totalUsers / req.size);
        const paginatedUsers = users.slice(
            (req.page - 1) * req.size,
            req.page * req.size
        );

        if (paginatedUsers.length === 0) {
            throw new HttpException("Data users tidak ditemukan", 404);
        }

        const actions = this.validateActions(userRole);

        return {
            data: paginatedUsers.map(user => this.toUserResponse(user, userRole)),
            actions: actions,
            paging: {
                currentPage: listRequest.page,
                totalPage: totalPage,
                size: listRequest.size,
            },
        };
    }

    async searchUser(req: SearchRequest, user: CurrentUserRequest): Promise<{ data: UserResponse[], actions: ActionAccessRights, paging: Paging }> {
        const searchRequest: SearchRequest = this.validationService.validate(UserValidation.SEARCH, req);

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();
        let users = await this.prismaService.user.findMany({
            include: {
                role: true,
            }
        });

        if (userRole === 'lcu') {
            users = users.filter(u => u.role.role.toLowerCase() === 'user' && u.dinas === user.user.dinas);
        }

        let filteredUsers = users;
        if (searchRequest.searchQuery) {
            const query = searchRequest.searchQuery.toLowerCase();
            if (userRole === 'super admin' || userRole === 'supervisor') {
                filteredUsers = users.filter(user => 
                    user.noPegawai?.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.name.toLowerCase().includes(query) ||
                    user.role?.role.toLowerCase().includes(query) ||
                    user.dinas?.toLowerCase().includes(query)
                );
            } else {
                filteredUsers = users.filter(user => 
                    user.noPegawai?.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.name.toLowerCase().includes(query)
                );
            }
    
        }

        const totalUsers = filteredUsers.length;
        const totalPage = Math.ceil(totalUsers / searchRequest.size);
        const paginatedUsers = filteredUsers.slice(
            (searchRequest.page - 1) * searchRequest.size,
            searchRequest.page * searchRequest.size
        );
    
        if (paginatedUsers.length === 0) {
            throw new HttpException("Data users tidak ditemukan", 204);
        }

        const actions = this.validateActions(userRole);
    
        return {
            data: paginatedUsers.map(user => ({
                ...this.toUserResponse(user, userRole),
            })),
            actions: actions,
            paging: {
                currentPage: searchRequest.page,
                totalPage: totalPage,
                size: searchRequest.size,
            },
        };
    }

    async checkUserExists(noPegawai: string, email: string) {
        if (noPegawai) {
            const totalUserwithSameNoPegawai = await this.prismaService.user.count({
                where: {
                    noPegawai: noPegawai,
                }
            });
    
            if (totalUserwithSameNoPegawai != 0) {
                throw new HttpException("No pegawai sudah digunakan", 400);
            }
        }

        const totalUserwithSameEmail = await this.prismaService.user.count({
            where: {
                email: email,
            }
        });

        if(totalUserwithSameEmail != 0) {
            throw new HttpException("Email sudah digunakan", 400);
        }
    }

    toUserResponse(data: UserResponse, currentRoleUser: string): UserResponse {
        if(currentRoleUser === 'super admin' || currentRoleUser === 'lcu') {
            return {
                ...data,
                nik: data.nik,
            }
        }

        return {
            ...data,
        }
    }

    userSelectFields()  {
        return {
            id: true,
            noPegawai: true,
            email: true,
            name: true,
            dinas: true,
            roleId: true,
            role: true,
        };
    }

    private async findUser(userId: string): Promise<any> {
        const userSelectFields = this.userSelectFields();
        const findUser = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
            select: userSelectFields,
        });
        return findUser;
    }

    private async findRoleUser(): Promise<RoleResponse> {
        const roleUser = await this.prismaService.role.findFirst({
            where: { 
                role: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });
        return roleUser;
    }

    private async userWithRole(userId: string) {
        const userRequest = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                role: true
            }
        });

        return userRequest;
    }

    private validateNikForUser(req: any) {
        if (!req.nik) {
            throw new HttpException('NIK tidak boleh kosong', 400);
        }
    }
    
    private async validateParticipantNik(nik: string) {
        const participant = await this.prismaService.participant.findUnique({
            where: { nik: nik },
        });
    
        if (!participant) {
            throw new HttpException('NIK tidak ada di data peserta', 400);
        }
    }
    
    private validateNikForNonUserRoles(nik: string) {
        if (nik) {
            throw new HttpException('Role super admin, supervisor, dan LCU tidak perlu NIK', 400);
        }
    }
    
    private validateDinas(dinas: string) {
        if (!dinas) {
            throw new HttpException('Dinas tidak boleh kosong', 400);
        }
    }
    
    private validateDinasForSuperAdmin(dinas: string) {
        if (dinas) {
            throw new HttpException('Role Super Admin tidak perlu dinas', 400);
        }
    }

    private validateRoleForLcuOrSupervisorRequest(reqRoleId: string, roleUserId: string): void {
        if (reqRoleId !== roleUserId) {
            throw new HttpException('LCU hanya dapat membuat, mengakses, dan menghapus akun dengan role user', 403);
        }
    }

    private validateDinasForLcuRequest(dinasRequest: string, dinasLCU: string) {
        if(dinasRequest != dinasLCU) {
            throw new HttpException('LCU hanya dapat membuat, mengakses, dan menghapus akun Pengguna dalam dinas yang sama', 403);
        }
    }

    private validateActions(userRole: string): ActionAccessRights {
        if(userRole === 'super admin' || userRole === 'lcu') {
            return {
                canEdit: true,
                canDelete: true,
                canView: true,
            }
        } else {
            return {
                canEdit: false,
                canDelete: false,
                canView: true,
            }
        }
    }
}