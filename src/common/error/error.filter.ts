import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { ZodError } from "zod";
import { buildResponse } from '../../model/web.model';

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
            errorResponse = buildResponse(statusCode, undefined, errors);
        } else if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const errors = exception.getResponse();
            errorResponse = buildResponse(statusCode, undefined, errors);
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            const errors = {
                message: exception.message,
            };
            errorResponse = buildResponse(statusCode, undefined, errors);
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
