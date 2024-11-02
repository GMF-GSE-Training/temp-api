export interface CreateCOT {
    kodeCot: string;
    capabilityId: string;
    tanggalMulai: Date;
    tanggalSelesai: Date;
    lokasiTraining: string;
    instrukturTeoriRegulasiGse: string;
    instrukturTeoriKompetensi: string;
    instrukturPraktek1: string;
    instrukturPraktek2: string;
    status?: boolean;
}

export interface UpdateCot {
    kodeCot?: string;
    capabilityId?: string;
    tanggalMulai?: Date;
    tanggalSelesai?: Date;
    lokasiTraining?: string;
    instrukturTeoriRegulasiGse?: string;
    instrukturTeoriKompetensi?: string;
    instrukturPraktek1?: string;
    instrukturPraktek2?: string;
    status?: boolean;
}

export interface CotResponse {
    kodeCot: string;
    capabilityId: string;
    tanggalMulai: Date;
    tanggalSelesai: Date;
    lokasiTraining: string;
    instrukturTeoriRegulasiGse: string;
    instrukturTeoriKompetensi: string;
    instrukturPraktek1: string;
    instrukturPraktek2: string;
    status: boolean;
    capability?: Object;
}