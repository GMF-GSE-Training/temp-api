import { HttpStatus } from "@nestjs/common";

export class WebResponse<T> {
    code: string;
    status: string;
    data?: T;
    errors?: string;
    paging?: Paging; 
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
): WebResponse<T> {
    const statusMessage = HttpStatus[statusCode] || 'UNKNOWN_STATUS';
    return {
        code: statusCode.toString(),
        status: statusMessage,
        ...(data && { data }), // Hanya tambahkan data jika ada
        ...(errors && { errors }), // Hanya tambahkan errors jika ada
        ...(paging && { paging }), // Tambahkan paging jika ada
    };
}