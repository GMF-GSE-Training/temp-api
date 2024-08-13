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
    sim_a: string;
    sim_b: string;
    ktp: string;
    foto: string;
    surat_sehat_buta_warna: string;
    exp_surat_sehat: Date;
    surat_bebas_narkoba: string;
    exp_bebas_narkoba: Date;
    link_qr_code?: string;
    qr_code?: string;
}

export interface ParticipantResponse {
    id: number;
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
    sim_a: string;
    sim_b: string;
    ktp: string;
    foto: string;
    surat_sehat_buta_warna: string;
    exp_surat_sehat: Date;
    surat_bebas_narkoba: string;
    exp_bebas_narkoba: Date;
    link_qr_code: string;
    qr_code: string;
}