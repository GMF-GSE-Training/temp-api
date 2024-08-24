import { HttpStatus, StreamableFile } from "@nestjs/common";

export class WebResponse<T> {
    code: number;
    status: string;
    data?: T;
    errors?: string;
    paging?: Paging;
    fileStream?: StreamableFile;
}

export interface Paging  {
    total_page: number;
    current_page: number;
    size: number;
}

export function buildResponse<T>(
    statusCode: number, 
    data?: T, 
    errors?: any,
    paging?: Paging,
    fileStream?: StreamableFile,
): WebResponse<T> {
    const statusMessage = HttpStatus[statusCode] || 'UNKNOWN_STATUS';
    return {
        code: statusCode,
        status: statusMessage,
        ...(data && { data }), // Hanya tambahkan data jika ada
        ...(errors && { errors }), // Hanya tambahkan errors jika ada
        ...(paging && { paging }), // Tambahkan paging jika ada
        ...(fileStream && { fileStream }), // Tambahkan fileStream jika ada
    };
}