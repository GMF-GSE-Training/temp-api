import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../src/common/service/prisma.service";
import * as bcrypt from 'bcrypt';
import { User } from "@prisma/client";

@Injectable()
export class UserTestService {
    constructor(private prismaService: PrismaService) {
    }

    async deleteMany() {
        await this.prismaService.user.deleteMany();
    }

    async deleteUser() {
        await this.prismaService.user.deleteMany({
            where: {
                OR:[
                    { email: 'superadmin@example.com' },
                    { email: 'supervisor@example.com' },
                    { email: 'lcu@example.com' },
                    { email: 'test@example.com' },
                    { email: 'tc@example.com' },
                ]
            }
        });
    }

    async createUser(){
        await this.prismaService.user.create({
            data: {
                no_pegawai: 'test',
                nik: 'test',
                email: 'test@example.com',
                name: 'test',
                password: await bcrypt.hash('test', 10),
                dinasId: 1,
                roleId: 4,
            }
        });
    }

    async createSuperAdmin(){
        await this.prismaService.user.create({
            data: {
                no_pegawai: 'super admin',
                nik: 'super admin',
                email: 'superadmin@example.com',
                name: 'super admin',
                password: await bcrypt.hash('super admin', 10),
                roleId: 1,
            }
        });
    }

    async createSupervisor(){
        await this.prismaService.user.create({
            data: {
                no_pegawai: 'supervisor',
                nik: 'supervisor',
                email: 'supervisor@example.com',
                name: 'supervisor',
                password: await bcrypt.hash('supervisor', 10),
                roleId: 2,
            }
        });
    }

    async createLCU(){
        await this.prismaService.user.create({
            data: {
                no_pegawai: 'lcu',
                nik: 'lcu',
                email: 'lcu@example.com',
                name: 'lcu',
                password: await bcrypt.hash('lcu', 10),
                dinasId: 1,
                roleId: 3,
            }
        });
    }

    async getSuperAdmin(): Promise<User> {
        return this.prismaService.user.findFirst({
            where: {
                OR: [
                    { no_pegawai: 'super admin' },
                    { email: 'superadmin@example.com' },
                ]
            }
        });
    }

    async getSupervisor(): Promise<User> {
        return this.prismaService.user.findFirst({
            where: {
                OR: [
                    { no_pegawai: 'supervisor' },
                    { email: 'supervisor@example.com' },
                ]
            }
        });
    }

    async getLCU(): Promise<User> {
        return this.prismaService.user.findFirst({
            where: {
                OR: [
                    { no_pegawai: 'lcu' },
                    { email: 'lcu@example.com' },
                ]
            }
        });
    }

    async getUser(): Promise<User> {
        return this.prismaService.user.findFirst({
            where: {
                OR: [
                    { no_pegawai: 'test' },
                    { email: 'test@example.com' },
                ]
            }
        });
    }

    async createUserDinasTC(){
        await this.prismaService.user.create({
            data: {
                no_pegawai: 'tc',
                nik: 'tc',
                email: 'tc@example.com',
                name: 'tc',
                password: await bcrypt.hash('tc', 10),
                dinasId: 2,
                roleId: 4,
            }
        });
    }

    async getUserDinasTC(): Promise<User> {
        return this.prismaService.user.findFirst({
            where: {
                OR: [
                    { no_pegawai: 'tc' },
                    { email: 'tc@example.com' },
                ]
            }
        });
    }
}