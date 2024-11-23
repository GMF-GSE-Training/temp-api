import { z, ZodType } from "zod";

export class CapabilityValidation {
    static readonly CREATE: ZodType = z.object({
        ratingCode: z.string().min(1).max(50),
        trainingCode: z.string().min(1).max(50),
        trainingName: z.string().min(1).max(50)
    });

    static readonly UPDATE: ZodType = z.object({
        ratingCode: z.string().min(1).max(50).optional(),
        trainingCode: z.string().min(1).max(50).optional(),
        trainingName: z.string().min(1).max(50).optional(), 
    });

    static readonly SEARCH: ZodType = z.object({
        searchQuery: z.string().min(1),
        page: z.number().min(1).positive(),
        size: z.number().min(1).positive(),
    });
}