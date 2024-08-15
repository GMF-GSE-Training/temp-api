import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { buildResponse } from "../../model/web.model";
import { ZodError } from "zod";

@Catch()
export class ErrorFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        
        const response = host.switchToHttp().getResponse();
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorResponse: any;

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            errorResponse = exception.getResponse();
        } else if (exception instanceof ZodError) {
            statusCode = HttpStatus.BAD_REQUEST;
            errorResponse = {
                errors: 'Validation error',
            };
        } else {    
            errorResponse = {
                errors: exception.message,
            };
        }

        const responseBody = buildResponse(statusCode, null, errorResponse);

        response.status(statusCode).json(responseBody);
    }
}