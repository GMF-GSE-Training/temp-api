import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserTestService } from './user.test.service';
import { UserTestModule } from './user.test.module';
import { ParticipantTestService } from '../participant/participant.test.service';
import { ParticipantTestModule } from '../participant/participant.test.module';

describe('AuthController', () => {
    let app: INestApplication;
    let logger: Logger;
    let userTestService: UserTestService;
    let participantTestService: ParticipantTestService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, UserTestModule, ParticipantTestModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        logger = app.get(WINSTON_MODULE_PROVIDER);
        userTestService = app.get(UserTestService);
        participantTestService = app.get(ParticipantTestService);
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await userTestService.deleteMany();
            await participantTestService.delete();
            await participantTestService.create();
            await userTestService.createUser(); 
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
            expect(response.body.data.dinas).toBe("TA");
            expect(response.body.data.roleId).toBe(4);
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
            expect(response.body.data.dinas).toBe("TA");
            expect(response.body.data.roleId).toBe(4);
        });

    });

    describe('GET /auth/current', () => {
        let token: string;

        beforeEach(async () => {
        await userTestService.deleteUser();
        await participantTestService.delete();
        await participantTestService.create();
        await userTestService.createUser();
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
        expect(response.body.data.dinas).toBe("TA");
        expect(response.body.data.roleId).toBe(4);
        });
    });

    describe('PATCH /auth/current', () => {
        let token: string;

        beforeEach(async () => {
            await userTestService.deleteUser();
            await participantTestService.delete();
            await participantTestService.create();
            await userTestService.createUser();
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'test',
                });
            token = response.body.data.token;
        });

        afterEach(async () => {
            await userTestService.deleteUser();
        });

        it('should be rejected if request is invalid', async () => {
            const response = await request(app.getHttpServer())
                .patch('/auth/current')
                .set('Authorization', `Bearer ${token}`)
                .send({
                no_pegawai: '',
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
                        dinas: "TB",
                    });

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.dinas).toBe("TB");
        });

        it('should be rejected if user update roleId', async () => {
        const response = await request(app.getHttpServer())
            .patch('/auth/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
                roleId: 3,
            });

        logger.info(response.body);

        expect(response.status).toBe(403);
        expect(response.body.errors).toBeDefined();
        });

        it('should be able to user update all', async () => {
            let response = await request(app.getHttpServer())
                .patch('/auth/current')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    no_pegawai: 'test updated',
                    email: 'testupdated@example.com',
                    name: 'test updated',
                    password: 'test updated',
                    dinas: "TB",
                });

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.no_pegawai).toBe('test updated');
            expect(response.body.data.email).toBe('testupdated@example.com');
            expect(response.body.data.name).toBe('test updated');
            expect(response.body.data.dinas).toBe("TB");

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
            await userTestService.deleteUser();
            await participantTestService.delete();
            await participantTestService.create();
            await userTestService.createUser();
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'test',
                });
            token = response.body.data.token;
        });

        afterEach(async () => {
            await userTestService.deleteUser();
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
