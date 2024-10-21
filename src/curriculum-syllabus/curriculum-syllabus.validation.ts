import { z, ZodType } from "zod";

export class CurriculumSyllabusValidation {
    static readonly CREATE: ZodType = z.object({
        curriculumSyllabus: z.array(z.object({
            capabilityId: z.string().min(1),
            nama: z.string().min(1).max(50),
            durasiTeori: z.number().min(1).positive(),
            durasiPraktek: z.number().min(1).positive(),
            type: z.string().min(1),
        })),
    });

    static readonly UPDATE: ZodType = z.object({
        curriculumSyllabus: z.array(z.object({
            capabilityId: z.string().min(1).optional(),
            nama: z.string().min(1).max(50).optional(),
            durasiTeori: z.number().min(1).positive().optional(),
            durasiPraktek: z.number().min(1).positive().optional(),
            type: z.string().min(1),
        })),
    });
}