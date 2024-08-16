import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
    private schema = z.object({
        page: z.number().positive(),
        size: z.number().positive(),
    });

    transform(value: unknown, metadata: ArgumentMetadata) {
        try {
            const parsedValue = this.schema.parse(value);
            return parsedValue;
        } catch (error) {
            throw new BadRequestException('Validation failed');
        }
    }
}
