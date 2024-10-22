export interface CreateCapability {
    kodeRating: string;
    kodeTraining: string;
    namaTraining: string;
}

export interface UpdateCapability {
    kodeRating?: string;
    kodeTraining?: string;
    namaTraining?: string;
}

export interface CapabilityResponse {
    id: string;
    kodeRating: string;
    kodeTraining: string;
    namaTraining: string;
    totalDurasiTeoriRegGse?: number;
    totalDurasiPraktekRegGse?: number;
    totalDurasiTeoriKompetensi?: number;
    totalDurasiPraktekKompetensi?: number;
    TotalDurasi?: number;
    curriculumSyllabus?: Object[];
}
