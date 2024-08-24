import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
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
                code: statusCode.toString(),
                status: HttpStatus[statusCode],
                errors: errors,
            };
        } else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            errorResponse = {
                code: statusCode.toString(),
                status: HttpStatus[statusCode],
                errors: exception.message,
            };
        } else if(exception instanceof MulterError) {
            statusCode = HttpStatus.BAD_REQUEST;
            errorResponse = {
                code: statusCode.toString(),
                status: HttpStatus[statusCode],
                errors: {
                    field: exception.field,
                    message: exception.message,
                },
            };
        } else {
            console.log(exception)
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            errorResponse = {
                code: statusCode.toString(),
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
