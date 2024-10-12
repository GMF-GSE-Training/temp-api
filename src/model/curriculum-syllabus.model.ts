export interface CreateCurriculumSyllabus {
    curriculumSyllabus: {
        capabilityId: string;
        nama: string;
        durasiTeori: number;
        durasiPraktek: number;
        type: string;
    }[];
}
