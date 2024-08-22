import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { CreateUserRequest, ListUserRequest, RegisterUserRequest, SearchUserRequest, UpdateUserRequest, UserResponse } from "../model/user.model";
import { Logger } from 'winston';
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { User } from "@prisma/client";
import { Paging } from "src/model/web.model";

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ) {}

    async register(req: RegisterUserRequest): Promise<UserResponse> {
        if(req.roleId) {
            throw new HttpException('Anda tidak berhak menentukan role', 403);
        }

        const defaultRole = await this.prismaService.role.findFirst({
            where: { 
                role: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });

        if (!defaultRole) {
            throw new HttpException("Role tidak ditemukan", 404);
        }

        req.roleId = defaultRole.id;

        const registerRequest: RegisterUserRequest = this.validationService.validate(UserValidation.REGISTER, req);

        const participant = await this.prismaService.participant.findUnique({
            where: {
                nik: req.nik,
            }
        });

        if(!participant) {
            throw new HttpException('NIK tidak ada di data participant', 400);
        }

        if(registerRequest.no_pegawai) {
            if(registerRequest.no_pegawai !== participant.no_pegawai) {
                throw new HttpException('No Pegawai tidak ada di data peserta', 404);
            }
        }

        if(registerRequest.email) {
            if(registerRequest.email !== participant.email) {
                throw new HttpException('No Pegawai tidak ada di data peserta', 404);
            }
        }

        if(registerRequest.dinas) {
            if(registerRequest.dinas !== participant.dinas) {
                throw new HttpException('No Pegawai tidak ada di data peserta', 404);
            }
        }

        await this.checkUserExists(registerRequest.no_pegawai, registerRequest.email);

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const user = await this.prismaService.user.create({
            data: registerRequest,
        });

        
        return this.toUserResponse(user);
    }

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
        
        return this.toUserResponse(user);
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

        return this.toUserResponse(user);
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

        const result = await this.prismaService.user.update({
            where: {
                id: req.id,
            },
            data: updateRequest,
        });
        
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
            data: paginatedUsers.map(this.toUserResponse),
            paging: {
                current_page: listRequest.page,
                total_page: totalPage,
                size: listRequest.size,
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
                user.dinas?.toLowerCase().includes(query) ||
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
            data: paginatedUsers.map(this.toUserResponse),
            paging: {
                current_page: searchRequest.page,
                total_page: totalPage,
                size: searchRequest.size,
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

        const result = await this.prismaService.user.delete({
            where: {
                id: userId,
            }
        });

        return this.toUserResponse(result);
    }

    async checkUserExists(no_pegawai: string, email: string) {
        const totalUserwithSameNoPegawai = await this.prismaService.user.count({
            where: {
                no_pegawai: no_pegawai,
            }
        });

        if(totalUserwithSameNoPegawai != 0) {
            throw new HttpException("No pegawai sudah digunakan", 400);
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
        }
    }
}