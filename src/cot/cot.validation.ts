import { z, ZodType } from "zod";

export class CotValidation {
    static readonly CREATE: ZodType = z.object({
        capabilityId: z.string().min(1).max(255),
        startDate: z
        .string()
        .datetime()
        .transform((date) => new Date(date))
        .optional(),
    endDate: z
        .string()
        .datetime()
        .transform((date) => new Date(date))
        .optional(),
        trainingLocation: z.string().min(1).max(50),
        theoryInstructorRegGse: z.string().min(1).max(50),
        theoryInstructorCompetency: z.string().min(1).max(50),
        practicalInstructor1: z.string().min(1).max(50),
        practicalInstructor2: z.string().min(1).max(50),
        status: z.string().min(1).max(50),
    });

    static readonly UPDATE: ZodType = z.object({
        capabilityId: z.string().min(1).max(255).optional(),
        startDate: z
        .string()
        .datetime()
        .transform((date) => new Date(date))
        .optional(),
    endDate: z
        .string()
        .datetime()
        .transform((date) => new Date(date))
        .optional(),
        trainingLocation: z.string().min(1).max(50).optional(),
        theoryInstructorRegGse: z.string().min(1).max(50).optional(),
        theoryInstructorCompetency: z.string().min(1).max(50).optional(),
        practicalInstructor1: z.string().min(1).max(50).optional(),
        practicalInstructor2: z.string().min(1).max(50).optional(),
        status: z.string().min(1).max(50).optional(),
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