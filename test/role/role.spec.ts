import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserTestService } from '../user/user.test.service';
import { UserTestModule } from '../user/user.test.module';
import { RoleTestService } from './role.test.service';
import { RoleTestModule } from './role.test.module';


describe('AuthController', () => {
    let app: INestApplication;
    let logger: Logger;
    let userTestService: UserTestService;
    let roleTestService: RoleTestService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, UserTestModule, RoleTestModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        logger = app.get(WINSTON_MODULE_PROVIDER);
        userTestService = app.get(UserTestService);
        roleTestService = app.get(RoleTestService);
    });

    afterEach(async () => {
        await userTestService.deleteMany();
    });

    describe('POST /roles', () => {
        let token: string;
        let responseLogin: any;

        beforeEach(async () => {
            await roleTestService.deleteRole();
            await userTestService.createSuperAdmin();
            await userTestService.createLCU()
            await userTestService.createUser();
            await userTestService.createSupervisor();
        });

        it('should be rejected if request is invalid', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .post('/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: '',
                });

            logger.info(response.body);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if lcu create Role', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'lcu@example.com',
                    password: 'lcu',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .post('/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if user create Role', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'test',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .post('/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be able to super admin create role', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .post('/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.role).toBe('test');
        });

        it('should be able to supervisor create role', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'supervisor@example.com',
                    password: 'supervisor',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .post('/roles')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.role).toBe('test');
        });
    });
});
