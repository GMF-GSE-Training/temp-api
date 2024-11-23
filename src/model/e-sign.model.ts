export interface CreateESign {
    idNumber: string;
    role: string;
    name: string;
    eSign: Buffer;
    signFileName?: string;
    status: boolean;
}

export interface ESignResponse {
    idNumber: string;
    role: string;
    name: string;
    eSign?: Buffer;
    signFileName?: string;
    status: boolean;
}