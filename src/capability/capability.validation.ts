import { z, ZodType } from "zod";

export class CapabilityValidation {
    static readonly CREATE: ZodType = z.object({
        kodeRating: z.string().min(1).max(50),
        kodeTraining: z.string().min(1).max(50),
        namaTraining: z.string().min(1).max(50)
    });

    static readonly UPDATE: ZodType = z.object({
        kodeRating: z.string().min(1).max(50).optional(),
        kodeTraining: z.string().min(1).max(50).optional(),
        namaTraining: z.string().min(1).max(50).optional(),
    });
}