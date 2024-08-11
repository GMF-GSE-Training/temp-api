import { z, ZodType } from "zod";

export class DinasValidation {
    static readonly CREATE: ZodType = z.object({
        dinas: z.string().min(1).max(50),
    });
}