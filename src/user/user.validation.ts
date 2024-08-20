import { z, ZodType } from "zod";

export class UserValidation {
    static readonly REGISTER: ZodType = z.object({
        no_pegawai: z.string().max(20).optional(),
        nik: z.string().min(1).max(50),
        email: z.string().min(1).max(50).email(),
        name: z.string().min(1).max(50),    
        password: z.string().min(1).max(100),
        dinas: z.string().max(20).optional(),
        roleId: z.number()
    });

    static readonly CREATE: ZodType = z.object({
        no_pegawai: z.string().min(1).max(20).optional(),
        nik: z.string().min(1).max(50).optional(),
        email: z.string().min(1).max(50).email(),
        name: z.string().min(1).max(50),    
        password: z.string().min(1).max(100),
        dinas: z.string().min(1).max(20).optional(),
        roleId: z.number().positive(),
    });

    static readonly UPDATE: ZodType = z.object({
        no_pegawai: z.string().min(1).max(20).optional(),
        nik: z.string().min(1).max(50).optional(),
        email: z.string().min(1).max(50).email().optional(),
        name: z.string().min(1).max(50).optional(),    
        password: z.string().min(1).max(100).optional(),
        dinas: z.string().min(1).max(20).optional(),
        roleId: z.number().positive().optional(),
    });

    static readonly LIST: ZodType = z.object({
        page: z.number().positive().optional(),
        size: z.number().positive().optional(),
    });

    static readonly SEARCH: ZodType = z.object({
        searchQuery: z.string().min(1),
        page: z.number().min(1).positive(),
        size: z.number().min(1).positive(),
    });
}