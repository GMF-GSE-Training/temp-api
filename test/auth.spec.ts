import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestService } from './test.service';
import { TestModule } from './test.module';

describe('AuthController', () => {
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

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await testService.deleteUser();
            await testService.createUser();
        });

        it('should be rejected if request is invalid', async () => {
            const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                identifier: '',
                password: '',
            });

            logger.info(response.body);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should be able to login using email', async () => {
            const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                identifier: 'test@example.com',
                password: 'test',
            });

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.no_pegawai).toBe('test');
            expect(response.body.data.email).toBe('test@example.com');
            expect(response.body.data.name).toBe('test');
            expect(response.body.data.dinasId).toBeDefined();
            expect(response.body.data.roleId).toBeDefined();
        });

        it('should be able to login using no_pegawai', async () => {
            const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                identifier: 'test',
                password: 'test',
            });

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.no_pegawai).toBe('test');
            expect(response.body.data.email).toBe('test@example.com');
            expect(response.body.data.name).toBe('test');
            expect(response.body.data.dinasId).toBeDefined();
            expect(response.body.data.roleId).toBeDefined();
        });

    });

    describe('GET /auth/current', () => {
        let token: string;

        beforeEach(async () => {
        await testService.deleteUser();
        await testService.createUser();
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            identifier: 'test@example.com',
            password: 'test',
            });
        token = response.body.data.token;
        });

        it('should be rejected if token is invalid', async () => {
        const response = await request(app.getHttpServer())
            .get('/auth/current')
            .set('Authorization', 'wrong');

            logger.info(response.body);

        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        });

        it('should be able to get user', async () => {
        const response = await request(app.getHttpServer())
            .get('/auth/current')
            .set('Authorization', `Bearer ${token}`);

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBeDefined();
        expect(response.body.data.no_pegawai).toBe('test');
        expect(response.body.data.email).toBe('test@example.com');
        expect(response.body.data.name).toBe('test');
        expect(response.body.data.dinasId).toBeDefined();
        expect(response.body.data.roleId).toBeDefined();
        });
    });

    describe('PATCH /auth/current', () => {
        let token: string;

        beforeEach(async () => {
        await testService.deleteUser();
        await testService.createUser();
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            identifier: 'test@example.com',
            password: 'test',
            });
        token = response.body.data.token;
        });

        afterEach(async () => {
        await testService.deleteUser();
        });

        it('should be rejected if request is invalid', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
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

        it('should be able to user update no_pegawai', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            no_pegawai: 'test updated',
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.no_pegawai).toBe('test updated');
        });

        it('should be able to user update nik', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            nik: 'test updated',
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.nik).toBe('test updated');
        });

        it('should be able to user update email', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            email: 'testupdated@example.com',
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.email).toBe('testupdated@example.com');
        });

        it('should be able to user update name', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            name: 'test updated',
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('test updated');
        });

        it('should be able to user update password', async () => {
        let response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            password: 'test updated',
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('test');

        response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            identifier: 'test@example.com',
            password: 'test updated',
            }); 

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.token).toBeDefined();
        });

        it('should be able to user update dinasId', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            dinasId: 2,
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.dinasId).toBe(2);
        });

        it('should be able to user update roleId', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            roleId: 3,
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.roleId).toBe(3);
        });

        it('should be able to user update all', async () => {
        let response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
            no_pegawai: 'test updated',
            nik: 'test updated',
            email: 'testupdated@example.com',
            name: 'test updated',
            password: 'test updated',
            dinasId: 2,
            roleId: 3,
            });

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.no_pegawai).toBe('test updated');
        expect(response.body.data.nik).toBe('test updated');
        expect(response.body.data.email).toBe('testupdated@example.com');
        expect(response.body.data.name).toBe('test updated');
        expect(response.body.data.dinasId).toBe(2);
        expect(response.body.data.roleId).toBe(3);

        response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            identifier: 'testupdated@example.com',
            password: 'test updated',
            }); 

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data.token).toBeDefined();
        });
    });

    describe('DELETE /auth/current', () => {
        let token: string;

        beforeEach(async () => {
        await testService.deleteUser();
        await testService.createUser();
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
            identifier: 'test@example.com',
            password: 'test',
            });
        token = response.body.data.token;
        });

        afterEach(async () => {
        await testService.deleteUser();
        });

        it('should be rejected if token is invalid', async () => {
        const response = await request(app.getHttpServer())
            .delete('/auth/current')
            .set('Authorization', 'wrong');

            logger.info(response.body);

        expect(response.status).toBe(401);
        expect(response.body.errors).toBeDefined();
        });

        it('should be able to logout', async () => {
        const response = await request(app.getHttpServer())
            .delete('/auth/current')
            .set('Authorization', `Bearer ${token}`);

        logger.info(response.body);

        expect(response.status).toBe(200);
        expect(response.body.data).toBe(true);
        });
    });
});
