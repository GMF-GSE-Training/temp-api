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
    simAFileName?: string;
    simB?: Buffer;
    simBFileName?: string;
    ktp?: Buffer;
    ktpFileName?: string;
    foto?: Buffer;
    fotoFileName?: string;
    suratSehatButaWarna?: Buffer;
    suratSehatbutaWarnaFileName?: string;
    tglKeluarSuratSehatButaWarna?: Date;
    suratBebasNarkoba?: Buffer;
    suratBebasNarkobaFileName?: string;
    tglKeluarSuratBebasNarkoba?: Date;
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
    simAFileName?: string;
    simB?: Buffer;
    simBFileName?: string;
    ktp?: Buffer;
    ktpFileName?: string;
    foto?: Buffer;
    fotoFileName?: string;
    suratSehatButaWarna?: Buffer;
    suratSehatbutaWarnaFileName?: string;
    tglKeluarSuratSehatButaWarna?: Date;
    suratBebasNarkoba?: Buffer;
    suratBebasNarkobaFileName?: string;
    tglKeluarSuratBebasNarkoba?: Date;
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
    simAFileName?: string;
    simBFileName?: string;
    ktpFileName?: string;
    fotoFileName?: string;
    suratSehatButaWarnaFileName?: string;
    suratBebasNarkobaFileName?: string;
    tglKeluarSuratSehatButaWarna: Date;
    tglKeluarSuratBebasNarkoba: Date;
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
    simAFileName?: string;
    simBFileName?: string;
    ktpFileName?: string;
    fotoFileName?: string;
    suratSehatButaWarnaFileName?: string;
    suratBebasNarkobaFileName?: string;
    tglKeluarSuratSehatButaWarna: string;
    tglKeluarSuratBebasNarkoba: string;
    gmfNonGmf: string;
    linkQrCode: string;
}