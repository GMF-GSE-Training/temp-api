import { z, ZodType } from "zod";

export class CotValidation {
    static readonly CREATE: ZodType = z.object({
        kodeCot: z.string().min(1).max(20),
        capabilityId: z.string().min(1).max(255),
        tanggalMulai: z.date(),
        tanggalSelesai: z.date(),
        lokasiTraining: z.string().min(1).max(50),
        instrukturTeoriRegulasiGse: z.string().min(1).max(50),
        instrukturTeoriKompetensi: z.string().min(1).max(50),
        instrukturPraktek1: z.string().min(1).max(50),
        instrukturPraktek2: z.string().min(1).max(50),
        status: z.boolean().optional(),
    });

    static readonly UPDATE: ZodType = z.object({
        kodeCot: z.string().min(1).max(20).optional(),
        capabilityId: z.string().min(1).max(255).optional(),
        tanggalMulai: z.date().optional(),
        tanggalSelesai: z.date().optional(),
        lokasiTraining: z.string().min(1).max(50).optional(),
        instrukturTeoriRegulasiGse: z.string().min(1).max(50).optional(),
        instrukturTeoriKompetensi: z.string().min(1).max(50).optional(),
        instrukturPraktek1: z.string().min(1).max(50).optional(),
        instrukturPraktek2: z.string().min(1).max(50).optional(),
        status: z.boolean().optional(),
    });

    static readonly LIST: ZodType = z.object({
        page: z.number().positive().optional(),
        size: z.number().positive().optional(),
    });
}