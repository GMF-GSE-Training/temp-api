import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaClientKnownRequestError, PrismaClientRustPanicError, PrismaClientUnknownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { MulterError } from "multer";
import { ZodError } from "zod";

@Catch()
export class ErrorFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorResponse: any;

        if (exception instanceof ZodError) {
            statusCode = HttpStatus.BAD_REQUEST;
            const errors = this.formatZodErrors(exception.errors);
            errorResponse = {
                code: statusCode,
                status: HttpStatus[statusCode],
                errors: errors,
            };
        } else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            errorResponse = {
                code: statusCode,
                status: HttpStatus[statusCode],
                errors: exception.message,
            };
        } else if (exception instanceof MulterError) {
            statusCode = HttpStatus.BAD_REQUEST;
            errorResponse = {
                code: statusCode,
                status: HttpStatus[statusCode],
                errors: {
                    field: exception.field,
                    message: exception.message,
                },
            };
        } else if (exception instanceof PrismaClientKnownRequestError) {
            // Kesalahan kueri yang diketahui dari Prisma (misalnya, pelanggaran batasan unik)
            statusCode = HttpStatus.CONFLICT;
            errorResponse = {
                code: statusCode,
                status: HttpStatus[statusCode],
                errors: {
                    message: 'NIK sudah digunakan',
                    details: exception.message,
                },
            };
        } else if (exception instanceof PrismaClientUnknownRequestError) {
            // Kesalahan permintaan yang tidak diketahui dari Prisma
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errorResponse = {
                code: statusCode,
                status: HttpStatus[statusCode],
                errors: {
                    message: 'Unknown database error',
                    details: exception.message,
                },
            };
        } 
        // else if (exception instanceof PrismaClientValidationError) {
        //     // Kesalahan validasi dari Prisma
        //     statusCode = HttpStatus.BAD_REQUEST;
        //     errorResponse = {
        //         code: statusCode,
        //         status: HttpStatus[statusCode],
        //         errors: {
        //             message: 'Database validation error',
        //             details: exception.message,
        //         },
        //     };
        // } 
        else if (exception instanceof PrismaClientRustPanicError) {
            // Kesalahan internal dari Prisma (misalnya, panic di sisi Rust)
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errorResponse = {
                code: statusCode,
                status: HttpStatus[statusCode],
                errors: {
                    message: 'Internal server error in the database layer',
                    details: exception.message,
                },
            };
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errorResponse = {
                code: statusCode,
                status: HttpStatus[statusCode],
                errors: {
                    message: exception.message,
                },
            };
        }

        response.status(statusCode).json(errorResponse);
    }

    private formatZodErrors(zodErrors: any[]): Record<string, string[]> {
        const formattedErrors: Record<string, string[]> = {};

        zodErrors.forEach((error) => {
            const fieldName = error.path.join('.');
            if (!formattedErrors[fieldName]) {
                formattedErrors[fieldName] = [];
            }
            formattedErrors[fieldName].push(error.message);
        });

        return formattedErrors;
    }
}
