import { z, ZodType } from "zod";

export class CapabilityValidation {
    static readonly CREATE: ZodType = z.object({
        kode_rating: z.string().min(1).max(50),
        kode_training: z.string().min(1).max(50),
        nama_training: z.string().min(1).max(50)
    });
}