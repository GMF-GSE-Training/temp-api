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