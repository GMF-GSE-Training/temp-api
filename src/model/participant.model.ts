export interface CreateParticipantRequest {
    noPegawai?: string;
    nama: string;
    nik: string;
    dinas?: string;
    bidang?: string;
    perusahaan?: string;
    email: string;
    noTelp?: string;
    negara?: string;
    tempatLahir?: string;
    tanggalLahir?: Date;
    simA?: Buffer;
    simB?: Buffer;
    ktp?: Buffer;
    foto?: Buffer;
    suratSehatButaWarna?: Buffer;
    expSuratSehatButaWarna?: Date;
    suratBebasNarkoba?: Buffer;
    expSuratBebasNarkoba?: Date;
    gmfNonGmf?: string;
}

export interface UpdateParticipantRequest {
    noPegawai?: string;
    nama?: string;
    nik?: string;
    dinas?: string;
    bidang?: string;
    perusahaan?: string;
    email?: string;
    noTelp?: string;
    negara?: string;
    tempatLahir?: string;
    tanggalLahir?: Date;
    simA?: Buffer;
    simB?: Buffer;
    ktp?: Buffer;
    foto?: Buffer;
    suratSehatButaWarna?: Buffer;
    expSuratSehatButaWarna?: Date;
    suratBebasNarkoba?: Buffer;
    expSuratBebasNarkoba?: Date;
    gmfNonGmf?: string;
    linkQrCode?: string;
}

export interface ParticipantList {
    id: string;
    noPegawai: string;
    nama: string;
    nik?: string;
    dinas: string;
    bidang: string;
    perusahaan?: string;
    email: string;
    noTelp: string;
    negara: string;
    tempatLahir: string;
    tanggalLahir: Date;
    simAName?: string;
    simBName?: string;
    ktpName?: string;
    fotoName?: string;
    suratSehatButaWarnaName?: string;
    suratBebasNarkobaName?: string;
    expSuratSehatButaWarna: Date;
    expSuratBebasNarkoba: Date;
    gmfNonGmf: string;
    linkQrCode: string;
}

export interface ListParticipantResponse {
    id: string;
    noPegawai: string;
    nama: string;
    dinas: string;
    bidang: string;
    perusahaan: string;
}

export interface ParticipantResponse {
    id: string;
    noPegawai: string;
    nama: string;
    nik: string;
    dinas: string;
    bidang: string;
    perusahaan: string;
    email: string;
    noTelp: string;
    negara: string;
    tempatLahir: string;
    tanggalLahir: string;
    simAName?: string;
    simBName?: string;
    ktpName?: string;
    fotoName?: string;
    suratSehatButaWarnaName?: string;
    suratBebasNarkobaName?: string;
    expSuratSehatButaWarna: string;
    expSuratBebasNarkoba: string;
    gmfNonGmf: string;
    linkQrCode: string;
}