import { HttpStatus } from "@nestjs/common";

export class WebResponse<T> {
    code: string;
    status: string;
    data?: T;
    errors?: string;
}

export function buildResponse<T>(statusCode: number, data?: T, errors?: any): WebResponse<T> {
    const statusMessage = HttpStatus[statusCode] || 'UNKNOWN_STATUS';
    return {
        code: statusCode.toString(),
        status: statusMessage,
        ...(data && { data }), // Hanya tambahkan data jika ada
        ...(errors && { errors }) // Hanya tambahkan errors jika ada
    };
}