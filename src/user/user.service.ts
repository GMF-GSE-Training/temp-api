import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { CreateUserRequest, ListUserRequest, SearchUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { Paging } from "src/model/web.model";

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ) {}

    async create(req: CreateUserRequest): Promise<UserResponse> {
        const roleUser = await this.prismaService.role.findFirst({
            where: { 
                role: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });

        const roleLCU = await this.prismaService.role.findFirst({
            where: {
                role: {
                    equals: "lcu",
                    mode: "insensitive",
                }
            }
        });

        if(req.roleId === roleUser.id) {
            if(!req.nik) {
                throw new HttpException('Nik tidak boleh kosong', 400);
            }

            const participant = await this.prismaService.participant.findUnique({
                where: {
                    nik: req.nik,
                }
            });
    
            if(!participant) {
                throw new HttpException('NIK tidak ada di data peserta', 400);
            }
        } else if(req.roleId === roleLCU.id) {
            if(!req.dinas) {
                throw new HttpException('Dinas tidak boleh kosong', 400);
            }
        } else {
            if(req.nik) {
                throw new HttpException('Role super admin atau supervisor tidak perlu nik', 400);
            }
            
            if(req.roleId !== roleUser.id && req.roleId !== roleLCU.id && req.dinas) {
                throw new HttpException('Role super admin atau supervisor tidak perlu dinas', 400);
            }
        }

        const createRequest: CreateUserRequest = this.validationService.validate(UserValidation.CREATE, req);

        await this.checkUserExists(createRequest.no_pegawai, createRequest.email);

        createRequest.password = await bcrypt.hash(createRequest.password, 10);

        const user = await this.prismaService.user.create({
                data: createRequest,
        });

        const result: UserResponse = {
            ...user,
            links: {
                self: `/users/${user.id}`,
                update: `/users/${user.id}`,
                delete: `/users/${user.id}`,
            },
        }
        
        return this.toUserResponse(result);
    }

    async get(userId: number): Promise<UserResponse> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            }
        });

        if(!user) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        const result: UserResponse = {
            ...user,
            links: {
                self: `/users/${user.id}`,
                update: `/users/${user.id}`,
                delete: `/users/${user.id}`,
            },
        }
        
        return this.toUserResponse(result);
    }

    async update(req: UpdateUserRequest): Promise<UserResponse> {
        this.logger.debug(`UserService.register(${JSON.stringify(req)})`);

        const roleUser = await this.prismaService.role.findFirst({
            where: { 
                role: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });

        const roleLCU = await this.prismaService.role.findFirst({
            where: {
                role: {
                    equals: "lcu",
                    mode: "insensitive",
                }
            }
        });

        if(req.roleId) {
            if(req.roleId === roleUser.id || req.roleId === roleLCU.id) {
                if(!req.dinas) {
                    throw new HttpException('', 400);
                }
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

        const user = await this.prismaService.user.update({
            where: {
                id: req.id,
            },
            data: updateRequest,
        });
        
        const result: UserResponse = {
            ...user,
            links: {
                self: `/users/${user.id}`,
                update: `/users/${user.id}`,
                delete: `/users/${user.id}`,
            },
        }
        
        return this.toUserResponse(result);
    }

    async list(req: ListUserRequest, usersFromGuard):Promise<{ data: UserResponse[], paging: Paging }> {
        const listRequest: ListUserRequest = this.validationService.validate(UserValidation.LIST, req);

        // Lakukan paginasi pada pengguna yang sudah difilter oleh guard
        const totalUsers = usersFromGuard.length;
        const totalPage = Math.ceil(totalUsers / listRequest.size);
        const paginatedUsers = usersFromGuard.slice(
            (listRequest.page - 1) * listRequest.size,
            listRequest.page * listRequest.size
        );

        if (paginatedUsers.length === 0) {
            throw new HttpException("Data users tidak ditemukan", 404);
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

    async search(req: SearchUserRequest, usersFromGuard): Promise<{ data: UserResponse[], paging: Paging }> {
        const searchRequest: SearchUserRequest = this.validationService.validate(UserValidation.SEARCH, req);
    
        // Filter users berdasarkan searchQuery jika tersedia
        let filteredUsers = usersFromGuard;
        if (searchRequest.searchQuery) {
            const query = searchRequest.searchQuery.toLowerCase();
            filteredUsers = usersFromGuard.filter(user => 
                user.no_pegawai?.includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.name?.toLowerCase().includes(query) ||
                user.role?.role.toLowerCase().includes(query)
            );
        }
    
        // Lakukan paginasi pada pengguna yang sudah difilter oleh guard
        const totalUsers = filteredUsers.length;
        const totalPage = Math.ceil(totalUsers / searchRequest.size);
        const paginatedUsers = filteredUsers.slice(
            (searchRequest.page - 1) * searchRequest.size,
            searchRequest.page * searchRequest.size
        );
    
        if (paginatedUsers.length === 0) {
            throw new HttpException("Data users tidak ditemukan", 404);
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

    async delete(userId: number): Promise<UserResponse> {
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
            nik: deleteUser.nik,
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

    toUserResponse(user: UserResponse) {
        return {
            id: user.id,
            no_pegawai: user.no_pegawai,
            nik: user.nik,
            email: user.email,
            name: user.name,
            dinas: user.dinas,
            roleId: user.roleId,
            links: {
                self: `/users/${user.id}`,
                update: `/users/${user.id}`,
                delete: `/users/${user.id}`,
            },
        }
    }
}