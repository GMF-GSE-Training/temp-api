import { z, ZodType } from "zod";

export class ParticipantValidation {
    static readonly CREATE: ZodType = z.object({
        no_pegawai: z.string().min(1).max(20).optional(),
        nama: z.string().min(1).max(50),
        nik: z.string().min(1).min(1).max(50),
        dinas: z.string().min(1).max(50).optional(),
        bidang: z.string().min(1).max(50).optional(),
        perusahaan: z.string().min(1).max(50),
        email: z.string().email().min(1).max(50),
        no_telp: z.string().min(1).max(50),
        negara: z.string().min(1).max(50),
        tempat_lahir: z.string().max(50),
        tanggal_lahir: z.date(),
        sim_a: z.string().min(1).max(255),
        sim_b: z.string().min(1).max(255),
        ktp: z.string().min(1).max(255),
        foto: z.string().min(1).max(255),
        surat_sehat_buta_warna: z.string().min(1).max(255),
        exp_surat_sehat: z.date(),
        surat_bebas_narkoba: z.string().min(1).max(255),
        exp_bebas_narkoba: z.date(),
        link_qr_code: z.string().min(1).max(255).optional(),
        qr_code: z.string().min(1).max(255),
        gmf_non_gmf: z.string().min(1).max(20),
    });
}