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
                    { email: 'test2@example.com' },
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
                dinas: "TA",
                roleId: 4,
            }
        });
    }

    async createSuperAdmin(){
        await this.prismaService.user.create({
            data: {
                no_pegawai: 'super admin',
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
                email: 'lcu@example.com',
                name: 'lcu',
                password: await bcrypt.hash('lcu', 10),
                dinas: "TA",
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

    async createOtherUser(){
        await this.prismaService.user.create({
            data: {
                no_pegawai: 'test2',
                nik: 'test2',
                email: 'test2@example.com',
                name: 'test2',
                password: await bcrypt.hash('test2', 10),
                dinas: "TC",
                roleId: 4,
            }
        });
    }

    async getOtherUser(): Promise<User> {
        return this.prismaService.user.findFirst({
            where: {
                OR: [
                    { no_pegawai: 'test2' },
                    { email: 'test2@example.com' },
                ]
            }
        });
    }
}