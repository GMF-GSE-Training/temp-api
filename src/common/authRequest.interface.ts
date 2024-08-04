import { Request } from 'express';
import { User } from '@prisma/client';

interface AuthenticatedRequest extends Request {
    user: User;
}
