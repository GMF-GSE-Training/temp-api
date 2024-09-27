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