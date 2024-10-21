export interface CreateCapability {
    kodeRating: string;
    kodeTraining: string;
    namaTraining: string;
}

export interface CapabilityResponse {
    id: string;
    kodeRating: string;
    kodeTraining: string;
    namaTraining: string;
    totalDurasiTeoriRegGse?: string;
    totalDurasiPraktekRegGse?: string;
    totalDurasiTeoriKompetensi?: string;
    totalDurasiPraktekKompetensi?: string;
    TotalDurasi?: string;
    curriculumSyllabus?: Object[];
}
