import { HttpStatus, StreamableFile } from "@nestjs/common";

export class WebResponse<T> {
    code: number;
    status: string;
    data?: T;
    errors?: string;
    paging?: Paging;
    fileStream?: StreamableFile;
}

export interface ActionAccessRights {
    canEdit?: boolean;
    canDelete?: boolean;
    canView?: boolean;
    canPrint?: boolean;
}

export interface Paging  {
    totalPage: number;
    currentPage: number;
    size: number;
}

export interface ListRequest {
    page?: number,
    size?: number,
}

export interface SearchRequest {
    searchQuery: string;
    page: number;
    size: number;
}

export function buildResponse<T>(
    statusCode: number, 
    data?: T, 
    errors?: any,
    actions?: ActionAccessRights,
    paging?: Paging,
    fileStream?: StreamableFile,
): WebResponse<T> {
    const statusMessage = HttpStatus[statusCode] || 'UNKNOWN_STATUS';
    return {
        code: statusCode,
        status: statusMessage,
        ...(data && { data }), // Hanya tambahkan data jika ada
        ...(errors && { errors }), // Hanya tambahkan errors jika ada
        ...(actions && { actions }), // Tambahkan actions jika ada
        ...(paging && { paging }), // Tambahkan paging jika ada
        ...(fileStream && { fileStream }), // Tambahkan fileStream jika ada
    };
}