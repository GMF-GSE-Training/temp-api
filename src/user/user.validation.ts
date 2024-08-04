import { z, ZodType } from "zod";

export class UserValidation {
    static readonly REGISTER: ZodType = z.object({
        no_pegawai: z.string().min(1).max(20).optional(),
        nik: z.string().min(1).max(50).optional(),
        email: z.string().min(1).max(50).email(),
        name: z.string().min(1).max(50),    
        password: z.string().min(1).max(100),
        dinasId: z.number().optional(),
        roleId: z.number()
    });
}