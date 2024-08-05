import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';

describe('UserController', () => {
  let app: INestApplication;
  let logger: Logger;
  let testService: TestService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    logger = app.get(WINSTON_MODULE_PROVIDER);
    testService = app.get(TestService);
  });

  describe('POST /users/register', () => {
    beforeEach(async () => {
      await testService.deleteUser();
    });

    it('should be rejected if request is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          no_pegawai: '',
          nik: '',
          email: '',
          name: '',
          password: '',
          dinasId: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to user register user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinasId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.nik).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.dinasId).toBe(1);
      expect(response.body.data.roleId).toBe(4);
    });

    it('should be rejected if no_pegawai already exists', async () => {
      await testService.createUser();
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          no_pegawai: 'test',
          nik: 'abcd',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinasId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /users/create, super admin creates all users', () => {
    let token: string;

    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createSuperAdmin();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'superadmin@example.com',
          password: 'super admin',
        });
      token = response.body.data.token;
    });

    it('should be rejected if request is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: '',
          nik: '',
          email: '',
          name: '',
          password: '',
          dinasId: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to user create super admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.nik).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.roleId).toBe(1);
    });

    it('should be able to user create supervisor', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.nik).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.roleId).toBe(2);
    });

    it('should be able to user create lcu', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinasId: 1,
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.nik).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.dinasId).toBe(1);
      expect(response.body.data.roleId).toBe(3);
    });

    it('should be able to user create user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinasId: 1,
          roleId: 4,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.nik).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.dinasId).toBe(1);
      expect(response.body.data.roleId).toBe(4);
    });

    it('should be rejected if no_pegawai already exists', async () => {
      await testService.createUser();
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinasId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
});
