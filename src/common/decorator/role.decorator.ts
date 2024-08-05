import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const Roles = (...roles: Role["role"][]) => {
    // Normalisasi nama role ke huruf kecil
    const normalizedRoles = roles.map(role => role.toLowerCase());
    return SetMetadata('roles', normalizedRoles);
};
