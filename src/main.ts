import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as cookieParser from 'cookie-parser';
import { jwtConstants } from './config/constants';
import { PrismaService } from './common/service/prisma.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  const prismaService = app.get(PrismaService);
  await seedDatabase(prismaService);

  app.enableCors({
    origin: `*`,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Authorization, Content-Type',
    credentials: true,
  });

  app.use(cookieParser());

  const port = process.env.PORT
  await app.listen(port);
}

async function seedDatabase(prismaService: PrismaService) {
  const superAdminNoPegawai = jwtConstants.super_admin_no_pegawai;
  const superAdminEmail = jwtConstants.super_admin_email;
  const superAdminName = jwtConstants.super_admin_name;
  const superAdminPassword = jwtConstants.super_admin_password;

  const superAdminHashedPassword = await bcrypt.hash(superAdminPassword, 10);

  // Check if roles already exist
  const existingRoles = await prismaService.role.findMany({
    where: {
      role: { in: ['super admin', 'supervisor', 'lcu', 'user'] },
    },
  });

  // If roles don't exist, create them
  if (existingRoles.length === 0) {
    await prismaService.role.createMany({
      data: [
        { role: 'super admin' },
        { role: 'supervisor' },
        { role: 'lcu' },
        { role: 'user' },
      ],
    });
  }

  // Check if super admin role exists
  const superAdminRole = await prismaService.role.findFirst({
    where: {
      role: 'super admin',
    },
  });

  if (!superAdminRole) {
    console.log('Super admin role does not exist');
    return;
  }

  // Check if super admin user already exists
  const existingUser = await prismaService.user.findFirst({
    where: { email: superAdminEmail },
  });

  if (!existingUser) {
    await prismaService.user.create({
      data: {
        no_pegawai: superAdminNoPegawai,
        email: superAdminEmail,
        name: superAdminName,
        password: superAdminHashedPassword,
        roleId: superAdminRole.id,
      },
    });

    console.log('Super admin user created successfully.');
  } else {
    console.log('Super admin user already exists.');
  }
}

bootstrap();
