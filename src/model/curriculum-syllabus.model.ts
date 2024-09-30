export interface CreateCurriculumSyllabus {
    capabilityId: string;
    total_durasi: number;
    regulasiGSEs: RegulasiGSECurriculumSyllabus[];
    kompetensis: KompetensiCurriculumSyllabus[];
}

export interface RegulasiGSE {
    reg_gse: string;
}

export interface Kompetensi {
    kompetensi: string;
}

export interface RegulasiGSECurriculumSyllabus {
    reg_gse: string;
    durasi_teori: number;
    durasi_praktek: number;
}

export interface KompetensiCurriculumSyllabus {
    kompetensi: string;
    durasi_teori: number;
    durasi_praktek: number;
}