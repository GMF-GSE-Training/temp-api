export interface CreateESign {
    noPegawai: string;
    role: string;
    name: string;
    eSign: Buffer;
    eSignFileName?: string;
    status: boolean;
}