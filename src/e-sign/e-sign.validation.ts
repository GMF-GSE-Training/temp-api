import { z, ZodType } from "zod";

export class ESignValidation {
    static readonly CREATE: ZodType = z.object({
        idNumber: z.string().min(1).max(20),
        role: z.string().min(1).max(50),
        name: z.string().min(1).max(50),
        eSign: z.instanceof(Buffer),
        signFileName: z.string().optional(),
        status: z.boolean(),
    });
}