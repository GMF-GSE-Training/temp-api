export interface CreateCurriculumSyllabus {
    curriculumSyllabus: {
        capabilityId: string;
        nama: string;
        durasiTeori: number;
        durasiPraktek: number;
        type: string;
    }[];
}

export interface UpdateCurriculumSyllabus {
    curriculumSyllabus?: {
        id: string;
        capabilityId?: string;
        nama?: string;
        durasiTeori?: number;
        durasiPraktek?: number;
        type?: string;
    }[];
}
