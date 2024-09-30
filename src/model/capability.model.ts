export interface CreateCapability {
    kode_rating: string;
    kode_training: string;
    nama_training: string;
}

export interface UpdateCapability {
    kode_rating?: string;
    kode_training?: string;
    nama_training?: string;
}

export interface CapabilityResponse {
    id: string;
    kode_rating: string;
    kode_training: string;
    nama_training: string;
}

export interface ListCapabilityResponse {
    id: string; // UUID string
    kode_rating: string;
    kode_training: string;
    nama_training: string;
    curriculums: {
        regulasiGSEs: RegulasiGSE[];
        kompetensis: Kompetensi[];
        total_durasi: number;
    };
}

export interface RegulasiGSE {
    id: string; // UUID string
    durasi_praktek: number;
    durasi_teori: number;
}

export interface Kompetensi {
    id: string; // UUID string
    durasi_praktek: number;
    durasi_teori: number;
}
