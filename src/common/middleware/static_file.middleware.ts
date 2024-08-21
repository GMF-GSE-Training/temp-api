import { Injectable, NestMiddleware, HttpException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../config/constants';
import { join } from 'path';
import { createReadStream, existsSync } from 'fs';

@Injectable()
export class StaticFileMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const filePath = join(__dirname, '..', '..', 'uploads', req.path);

        if (existsSync(filePath)) {
            const fileStream = createReadStream(filePath);
            fileStream.pipe(res);
        } else {
            next();
        }
    }
}
