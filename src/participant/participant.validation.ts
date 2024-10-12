import { z, ZodType } from "zod";

export class ParticipantValidation {
    static readonly CREATE: ZodType = z.object({
        noPegawai: z.string().min(1).max(20).optional().nullable(),
        nama: z.string().min(1).max(50),
        nik: z.string().min(1).min(1).max(50),
        dinas: z.string().min(1).max(50).optional().nullable(),
        bidang: z.string().min(1).max(50).optional().nullable(),
        perusahaan: z.string().min(1).max(50).optional(),
        email: z.string().email().min(1).max(50).optional(),
        noTelp: z.string().min(1).max(50).optional(),
        negara: z.string().min(1).max(50).optional(),
        tempatLahir: z.string().max(50).optional(),
        tanggalLahir: z.date().optional(),
        simA: z.instanceof(Buffer).optional(),
        simB: z.instanceof(Buffer).optional(),
        ktp: z.instanceof(Buffer).optional(),
        foto: z.instanceof(Buffer).optional(),
        suratSehatButaWarna: z.instanceof(Buffer).optional(),
        expSuratSehatButaWarna: z.date().optional(),
        suratBebasNarkoba: z.instanceof(Buffer).optional(),
        expSuratBebasNarkoba: z.date().optional(),
        linkQrCode: z.string().min(1).max(255).optional(),
        qrCode: z.instanceof(Buffer).optional(),
        gmfNonGmf: z.string().min(1).max(20).optional(),
    });

    static readonly UPDATE: ZodType = z.object({
        noPegawai: z.string().max(20).optional().nullable(),
        nama: z.string().min(1).max(50).optional(),
        nik: z.string().min(1).min(1).max(50).optional(),
        dinas: z.string().max(50).optional().nullable(),
        bidang: z.string().max(50).optional().nullable(),
        perusahaan: z.string().min(1).max(50).optional(),
        email: z.string().email().min(1).max(50).optional(),
        noTelp: z.string().min(1).max(50).optional(),
        negara: z.string().min(1).max(50).optional(),
        tempatLahir: z.string().max(50).optional(),
        tanggalLahir: z.date().optional(),
        simA: z.instanceof(Buffer).optional(),
        simB: z.instanceof(Buffer).optional(),
        ktp: z.instanceof(Buffer).optional(),
        foto: z.instanceof(Buffer).optional(),
        suratSehatButaWarna: z.instanceof(Buffer).optional(),
        expSuratSehatButaWarna: z.date().optional(),
        suratBebasNarkoba: z.instanceof(Buffer).optional(),
        expSuratBebasNarkoba: z.date().optional(),
        linkQrCode: z.string().min(1).max(255).optional(),
        qrCode: z.instanceof(Buffer).optional(),
        gmfNonGmf: z.string().min(1).max(20).optional(),
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