import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { CreateUserRequest, UpdateUserRequest, UserList, UserResponse } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { ListRequest, Paging, SearchRequest } from "src/model/web.model";
import { CurrentUserRequest } from "src/model/auth.model";
import { RoleResponse } from "src/model/role.model";

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ) {}

    async createUser(req: CreateUserRequest, user: CurrentUserRequest): Promise<UserResponse> {
        if(!req.roleId) {
            throw new HttpException('Role tidak boleh kosong', 404);
        }

        const userWithRole = await this.userWithRole(user.user.id);
        const userRequest = userWithRole.role.role.toLowerCase();

        const roleUser = await this.findRoleUser();

        const roleLCU = await this.prismaService.role.findFirst({
            where: {
                role: {
                    equals: "lcu",
                    mode: "insensitive",
                }
            }
        });

        if (req.roleId === roleUser.id) {
            this.validateNikForUser(req);
            await this.validateParticipantNik(req.nik);
        } else if (req.roleId === roleLCU.id) {
            this.validateNikForNonUserRoles(req.nik);
            this.validateDinas(req.dinas);
        } else {
            this.validateNikForNonUserRoles(req.nik);
            this.validateDinasForAdminOrSupervisor(req.dinas);
        }

        if(userRequest === 'lcu') {
            this.validateRoleForLcuRequest(req.roleId, roleUser.id);
            this.validateDinasForLcuRequest(req.dinas, userWithRole.dinas);
        }

        const createRequest: CreateUserRequest = this.validationService.validate(UserValidation.CREATE, req);

        await this.checkUserExists(createRequest.no_pegawai, createRequest.email);

        createRequest.password = await bcrypt.hash(createRequest.password, 10);

        const userSelectFields = this.userSelectFields();

        const createUser = await this.prismaService.user.create({
                data: createRequest,
                select: userSelectFields,
        });

        const result: UserResponse = {
            ...createUser,
            links: {
                self: `/users/${createUser.id}`,
                update: `/users/${createUser.id}`,
                delete: `/users/${createUser.id}`,
            },
        }
        
        return this.toUserResponse(result);
    }

    async getUser(userId: string, user: CurrentUserRequest): Promise<UserResponse> {
        const findUser = await this.findUser(userId);
        if(!findUser) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        const userWithRole = await this.userWithRole(user.user.id);
        const userRequest = userWithRole.role.role.toLowerCase();
        const roleUser = await this.findRoleUser();

        if(userRequest === 'lcu') {
            this.validateRoleForLcuRequest(findUser.roleId, roleUser.id);
            this.validateDinasForLcuRequest(findUser.dinas, userWithRole.dinas);
        }

        const result: UserResponse = {
            ...findUser,
            links: {
                self: `/users/${findUser.id}`,
                update: `/users/${findUser.id}`,
                delete: `/users/${findUser.id}`,
            },
        }
        
        return this.toUserResponse(result);
    }

    async updateUser(userId: string, req: UpdateUserRequest, user: CurrentUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.register(${JSON.stringify(req)})`);

        const findUser = await this.findUser(userId);
        if(!findUser) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        if(req.nik) {
            await this.validateParticipantNik(req.nik);
        }

        const roleUser = await this.findRoleUser();
        const userWithRole = await this.userWithRole(user.user.id);
        const userRequest = userWithRole.role.role.toLowerCase();

        if(userRequest === 'lcu') {
            if(req.roleId) {
                this.validateRoleForLcuRequest(req.roleId, roleUser.id);
            }
            if(req.dinas) {
                this.validateDinasForLcuRequest(req.dinas, userWithRole.dinas);
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
            links: {
                self: `/users/${updateUser.id}`,
                update: `/users/${updateUser.id}`,
                delete: `/users/${updateUser.id}`,
            },
        }
        
        return this.toUserResponse(result);
    }

    async listUsers(req: ListRequest, user: CurrentUserRequest):Promise<{ data: UserResponse[], paging: Paging }> {
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
                    dinas: userWithRole.dinas,
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

        return {
            data: paginatedUsers.map(user => this.toUserResponse(user)),
            paging: {
                current_page: listRequest.page,
                total_page: totalPage,
                size: listRequest.size,
                links: {
                    next: totalPage > listRequest.page ? `/users/list/result?page=${listRequest.page + 1}&size=${listRequest.size}` : null,
                    prev: listRequest.page > 1 ? `/users/list/result?page=${listRequest.page - 1}&size=${listRequest.size}` : null,
                }
            },
        };
    }

    async searchUser(req: SearchRequest, user: CurrentUserRequest): Promise<{ data: UserResponse[], paging: Paging }> {
        const searchRequest: SearchRequest = this.validationService.validate(UserValidation.SEARCH, req);

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();
        let users = await this.prismaService.user.findMany({
            include: {
                role: true,
            }
        });

        if (userRole === 'lcu') {
            users = users.filter(u => u.role.role.toLowerCase() === 'user' && u.dinas === userWithRole.dinas);
        }

        let filteredUsers = users;
        if (searchRequest.searchQuery) {
            const query = searchRequest.searchQuery.toLowerCase();
            if (userRole === 'super admin' || userRole === 'supervisor') {
                filteredUsers = users.filter(user => 
                    user.no_pegawai?.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.name.toLowerCase().includes(query) ||
                    user.role?.role.toLowerCase().includes(query) ||
                    user.dinas?.toLowerCase().includes(query)
                );
            } else {
                filteredUsers = users.filter(user => 
                    user.no_pegawai?.toLowerCase().includes(query) ||
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
    
        return {
            data: paginatedUsers.map(user => ({
                ...this.toUserResponse(user),
                links: {
                    self: `/users/${user.id}`,
                    update: `/users/${user.id}`,
                    delete: `/users/${user.id}`,
                }
            })),
            paging: {
                current_page: searchRequest.page,
                total_page: totalPage,
                size: searchRequest.size,
                links: {
                    next: totalPage > searchRequest.page ? `/users/search/result?paging=${searchRequest.page + 1}&size=${searchRequest.size}` : null,
                    prev: searchRequest.page > 1 ? `/users/search/result?paging=${searchRequest.page - 1}&size=${searchRequest.size}` : null,
                }
            },
        };
    }

    async delete(userId: string): Promise<UserResponse> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            }
        });

        if(!user) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        const deleteUser = await this.prismaService.user.delete({
            where: {
                id: userId,
            }
        });

        const result: UserResponse = {
            id: deleteUser.id,
            no_pegawai: deleteUser.no_pegawai,
            email: deleteUser.email,
            name: deleteUser.name,
            dinas: deleteUser.dinas,
            roleId: deleteUser.roleId,
            links: {
                self: `/users/${deleteUser.id}`,
                update: `/users/${deleteUser.id}`,
                delete: `/users/${deleteUser.id}`,
            },
        }

        return this.toUserResponse(result);
    }

    async checkUserExists(no_pegawai: string, email: string) {
        if (no_pegawai) {
            const totalUserwithSameNoPegawai = await this.prismaService.user.count({
                where: {
                    no_pegawai: no_pegawai,
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

    private async userWithRole(userId: string) {
        const userRequest = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                role: true
            }
        });
        return userRequest;
    }

    toUserResponse(user: UserList): UserResponse {
        return {
            ...user,
            links: {
                self: `/users/${user.id}`,
                update: `/users/${user.id}`,
                delete: `/users/${user.id}`,
            },
        }
    }

    userSelectFields()  {
        return {
            id: true,
            no_pegawai: true,
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
    
    private validateDinasForAdminOrSupervisor(dinas: string) {
        if (dinas) {
            throw new HttpException('Role super admin atau supervisor tidak perlu dinas', 400);
        }
    }

    private validateRoleForLcuRequest(reqRoleId: string, roleUserId: string): void {
        if (reqRoleId !== roleUserId) {
            throw new HttpException('LCU hanya dapat membuat, mengakses, dan menghapus akun dengan role user', 403);
        }
    }

    private validateDinasForLcuRequest(dinasRequest: string, dinasLCU: string) {
        if(dinasRequest != dinasLCU) {
            throw new HttpException('LCU hanya dapat membuat, mengakses, dan menghapus akun Pengguna dalam dinas yang sama', 403);
        }
    }
}