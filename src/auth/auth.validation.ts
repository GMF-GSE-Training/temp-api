import { z, ZodType } from "zod";

export class AuthValidation {
    static readonly REGISTER: ZodType = z.object({
        no_pegawai: z.string().max(20).optional(),
        nik: z.string().min(1).max(50),
        email: z.string().min(1).max(50).email(),
        name: z.string().min(1).max(50),    
        password: z.string().min(1).max(100),
        dinas: z.string().max(20).optional(),
        roleId: z.string().min(1),
    });
    
    static readonly LOGIN: ZodType = z.object({
        identifier: z.string().min(1).max(50),
        password: z.string().min(1).max(100),
    });

    static readonly UPDATE: ZodType = z.object({
        no_pegawai: z.string().min(1).max(20).optional(),
        nik: z.string().min(1).max(50).optional().optional(),
        email: z.string().min(1).max(50).email().optional(),
        name: z.string().min(1).max(50).optional(),  
        password: z.string().min(1).max(100).optional(),
        dinas: z.string().min(1).max(20).optional(),
        roleId: z.string().min(1).optional(),
    });

    static readonly RESETPASSWORD: ZodType = z.object({
        token: z.string().min(1),
        newPassword: z.string().min(1).max(20),
        confirmNewPassword: z.string().min(1).max(20),
    });
}