export interface CreateCurriculumSyllabus {
    curriculum_syllabus: {
        capabilityId: string;
        nama: string;
        durasi_teori: number;
        durasi_praktek: number;
        type: string;
    }[];
}
