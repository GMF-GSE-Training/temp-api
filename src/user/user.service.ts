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
import { CoreHelper } from "src/shared/helpers/core.helper";
import { UserHelper } from "src/shared/helpers/user.helper";

@Injectable()
export class UserService {
    constructor(
        private readonly validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private readonly prismaService: PrismaService,
        private readonly coreHelper: CoreHelper,
        private readonly userHelper: UserHelper,
    ) {}

    async createUser(req: CreateUserRequest, user: CurrentUserRequest): Promise<UserResponse> {
        const createRequest: CreateUserRequest = this.validationService.validate(UserValidation.CREATE, req);
        createRequest.dinas ? createRequest.dinas.toUpperCase() : createRequest.dinas;

        await this.coreHelper.ensureUniqueFields('user', [
            { field: 'idNumber', value: createRequest.idNumber, message: 'No pegawai sudah digunakan' },
            { field: 'email', value: createRequest.email, message: 'Email sudah digunakan' }
        ]);

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

        const roleUser = await this.userHelper.findRoleUser();

        const role = await this.prismaService.role.findUnique({
            where: {
                id: createRequest.roleId
            }
        });

        if(!role) {
            throw new HttpException('Role tidak valid', 400);
        }

        const roleRequest = role.name.toLowerCase();

        if (roleRequest === 'user') {
            if(createRequest.participantId) {
                const participant = await this.prismaService.participant.findFirst({
                    where: {
                        id: createRequest.participantId
                    }
                });

                if(!participant) {
                    throw new HttpException('Participant tidak ditemukan', 404);
                }
            }
            this.validateNikForUser(createRequest);
            await this.validateParticipantByNik(createRequest);
        } else if (roleRequest === 'lcu') {
            this.validateNikForNonUserRoles(createRequest.nik);
            this.validateDinas(createRequest.dinas);
        } else if(roleRequest === 'supervisor') {
            this.validateNikForNonUserRoles(createRequest.nik);
            this.validateDinas(createRequest.dinas);
        } else {
            this.validateNikForNonUserRoles(createRequest.nik);
            this.validateDinasForSuperAdmin(createRequest.dinas);
        }

        if(userRole === 'lcu') {
            this.validateRoleForLcuOrSupervisorRequest(createRequest.roleId, roleUser.id);
            this.validateDinasForLcuRequest(createRequest.dinas, user.user.dinas);
        } else if(userRole === 'supervisor') {
            this.validateRoleForLcuOrSupervisorRequest(createRequest.roleId, roleUser.id);
        }

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

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();
        const roleUser = await this.userHelper.findRoleUser();

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

        const updateRequest: UpdateUserRequest = this.validationService.validate(UserValidation.UPDATE, req);

        const findUser = await this.findUser(userId);

        if(!findUser) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        const roleUser = await this.userHelper.findRoleUser();
        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

        if(userRole === 'lcu') {
            if(updateRequest.roleId) {
                this.validateRoleForLcuOrSupervisorRequest(updateRequest.roleId, roleUser.id);
            }
            if(updateRequest.dinas) {
                this.validateDinasForLcuRequest(updateRequest.dinas, user.user.dinas);
            }
        } else if(userRole === 'supervisor') {
            if(updateRequest.roleId) {
                this.validateRoleForLcuOrSupervisorRequest(updateRequest.roleId, roleUser.id);
            }
        }

        if(userRole !== 'super admin' && updateRequest.email) {
            throw new HttpException('Anda tidak bisa mengubah email pengguna', 400);
        }

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

        if(findUser.nik) {
            const updateParticipant = {
                idNumber: updateRequest.idNumber,
                name: updateRequest.name,
                nik: updateRequest.nik,
                dinas: updateRequest.dinas,
                email: updateRequest.email,
            };

            const participantUpdate = await this.prismaService.participant.findFirst({
                where: {
                    nik: findUser.nik,
                },
            });

            if(participantUpdate) {
                await this.prismaService.participant.update({
                    where: {
                        id: participantUpdate.id,
                    },
                    data: updateParticipant,
                });
            }
        }

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

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();
        const roleUser = await this.userHelper.findRoleUser();

        if(userRole === 'lcu') {
            this.validateRoleForLcuOrSupervisorRequest(findUser.roleId, roleUser.id);
            this.validateDinasForLcuRequest(findUser.dinas, user.user.dinas);
        }

        const deleteUser = await this.prismaService.user.delete({
            where: {
                id: userId,
            }
        });

        const result: UserResponse = {
            id: deleteUser.id,
            idNumber: deleteUser.idNumber,
            email: deleteUser.email,
            name: deleteUser.name,
            dinas: deleteUser.dinas,
            roleId: deleteUser.roleId,
        }

        return this.toUserResponse(result, userRole);
    }

    async listUsers(req: ListRequest, user: CurrentUserRequest):Promise<{ data: UserResponse[], actions: ActionAccessRights, paging: Paging }> {
        const listRequest: ListRequest = this.validationService.validate(UserValidation.LIST, req);
        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();

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
                        name: {
                            equals: 'user',
                            mode: 'insensitive',
                        },
                    },
                    dinas: {
                        equals: user.user.dinas,
                        mode: 'insensitive',
                    },
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

        const userWithRole = await this.coreHelper.userWithRole(user.user.id);
        const userRole = userWithRole.role.name.toLowerCase();
        let users = await this.prismaService.user.findMany({
            include: {
                role: true,
            }
        });

        if (userRole === 'lcu') {
            users = users.filter(u => u.role.name.toLowerCase() === 'user' && u.dinas === user.user.dinas);
        }

        let filteredUsers = users;
        if (searchRequest.searchQuery) {
            const query = searchRequest.searchQuery.toLowerCase();
            if (userRole === 'super admin' || userRole === 'supervisor') {
                filteredUsers = users.filter(user => 
                    user.idNumber?.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.name.toLowerCase().includes(query) ||
                    user.role?.name.toLowerCase().includes(query) ||
                    user.dinas?.toLowerCase().includes(query)
                );
            } else {
                filteredUsers = users.filter(user => 
                    user.idNumber?.toLowerCase().includes(query) ||
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
            participantId: true,
            idNumber: true,
            nik: true,
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

    private validateNikForUser(req: any) {
        if (!req.nik) {
            throw new HttpException('NIK tidak boleh kosong', 400);
        }
    }

    private async validateParticipantByNik(request: CreateUserRequest) {
        const participant = await this.prismaService.participant.findUnique({
            where: { nik: request.nik },
        });

        // Validasi idNumber, name, dan dinas
        if(participant) {
            if (request.idNumber && request.idNumber !== participant.idNumber) {
                throw new HttpException('No Pegawai tidak sesuai dengan data participant', 400);
            }
    
            if (request.name && request.name !== participant.name) {
                throw new HttpException('Nama tidak sesuai dengan data participant', 400);
            }
    
            if (request.email && request.email !== participant.email) {
                throw new HttpException('Email tidak sesuai dengan data participant', 400);
            }
    
            if (request.dinas && request.dinas !== participant.dinas) {
                throw new HttpException('Dinas tidak sesuai dengan data participant', 400);
            }
        } else {
            await this.prismaService.participant.create({
                data: {
                    idNumber: request.idNumber,
                    name: request.name,
                    nik: request.nik,
                    dinas: request.dinas,
                    email: request.email,
                }
            });
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
        const accessMap = {
            'super admin': { canEdit: true, canDelete: true },
            'supervisor': { canEdit: false, canDelete: false },
            'lcu': { canEdit: true, canDelete: true },
        }

        return this.coreHelper.validateActions(userRole, accessMap);
    }
}