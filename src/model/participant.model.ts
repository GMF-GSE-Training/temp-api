export interface CreateParticipantRequest {
    no_pegawai: string;
    nama: string;
    nik: string;
    dinas: string;
    bidang: string;
    perusahaan: string;
    email: string;
    no_telp: string;
    negara: string;
    tempat_lahir: string;
    tanggal_lahir: Date;
    sim_a: Buffer;
    sim_b: Buffer;
    ktp: Buffer;
    foto: Buffer;
    surat_sehat_buta_warna: Buffer;
    exp_surat_sehat: Date;
    surat_bebas_narkoba: Buffer;
    exp_bebas_narkoba: Date;
    gmf_non_gmf: string;
    link_qr_code?: string;
    qr_code?: Buffer;
}

export interface UpdateParticipantRequest {
    no_pegawai?: string;
    nama?: string;
    nik?: string;
    dinas?: string;
    bidang?: string;
    perusahaan?: string;
    email?: string;
    no_telp?: string;
    negara?: string;
    tempat_lahir?: string;
    tanggal_lahir?: Date;
    sim_a?: Buffer;
    sim_b?: Buffer;
    ktp?: Buffer;
    foto?: Buffer;
    surat_sehat_buta_warna?: Buffer;
    exp_surat_sehat?: Date;
    surat_bebas_narkoba?: Buffer;
    exp_bebas_narkoba?: Date;
    gmf_non_gmf?: string;
}

export interface ParticipantList {
    id: number;
    no_pegawai: string;
    nama: string;
    nik: string;
    dinas: string;
    bidang: string;
    perusahaan?: string;
    email: string;
    no_telp: string;
    negara: string;
    tempat_lahir: string;
    tanggal_lahir: Date;
    exp_surat_sehat: Date;
    exp_bebas_narkoba: Date;
    gmf_non_gmf: string;
    link_qr_code: string;
}

export interface ParticipantResponse {
    id: number;
    no_pegawai: string;
    nama: string;
    dinas: string;
    bidang: string;
    perusahaan?: string;
    email: string;
    no_telp: string;
    negara: string;
    tempat_lahir: string;
    tanggal_lahir: Date;
    exp_surat_sehat: Date;
    exp_bebas_narkoba: Date;
    gmf_non_gmf: string;
    link_qr_code?: string;
    links: {
        self: string;
        update: string;
        delete: string;
    }
}