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
        await roleTestService.deleteRole();
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

    describe('GET /roles', () => {
        let token: string;
        let responseLogin: any;

        beforeEach(async () => {
            await roleTestService.deleteRole();
            await userTestService.createSuperAdmin();
            await userTestService.createLCU()
            await userTestService.createUser();
            await userTestService.createSupervisor();
        });

        it('should be rejected if lcu get all Roles', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'lcu@example.com',
                    password: 'lcu',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .get('/roles')
                .set('Authorization', `Bearer ${token}`)
            
            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if user get all Roles', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'test',
                });

            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .get('/roles')
                .set('Authorization', `Bearer ${token}`)

            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be able to super admin get all roles', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });

            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .get('/roles')
                .set('Authorization', `Bearer ${token}`)
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(4);
            expect(response.body.data[0].role).toBe('Super Admin');
            expect(response.body.data[1].role).toBe('Supervisor');
            expect(response.body.data[2].role).toBe('LCU');
            expect(response.body.data[3].role).toBe('User');
        });

        it('should be able to supervisor get all roles', async () => {
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'supervisor@example.com',
                    password: 'supervisor',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .get('/roles')
                .set('Authorization', `Bearer ${token}`)
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(4);
            expect(response.body.data[0].role).toBe('Super Admin');
            expect(response.body.data[1].role).toBe('Supervisor');
            expect(response.body.data[2].role).toBe('LCU');
            expect(response.body.data[3].role).toBe('User');
        });
    });

    describe('PATCH /roles/:roleId', () => {
        let token: string;
        let responseLogin: any;

        beforeEach(async () => {
            await roleTestService.deleteRole();
            await userTestService.createSuperAdmin();
            await userTestService.createLCU()
            await userTestService.createUser();
            await userTestService.createSupervisor();
            await roleTestService.createRole();
        });

        it('should be rejected if role is not found', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .patch(`/roles/${role.id - role.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test updated',
                });

            logger.info(response.body);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if request is invalid', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .patch(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: '',
                });

            logger.info(response.body);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if lcu update Role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'lcu@example.com',
                    password: 'lcu',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .patch(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test updated'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if user update Role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'test',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .patch(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test updated'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be able to super admin update role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .patch(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test updated'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.role).toBe('test updated');
        });

        it('should be able to supervisor update role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'supervisor@example.com',
                    password: 'supervisor',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .patch(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    role: 'test updated'
                });
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBeDefined();
            expect(response.body.data.role).toBe('test updated');
        });
    });

    describe('DELETE /roles/:roleId', () => {
        let token: string;
        let responseLogin: any;

        beforeEach(async () => {
            await roleTestService.deleteRole();
            await userTestService.createSuperAdmin();
            await userTestService.createLCU()
            await userTestService.createUser();
            await userTestService.createSupervisor();
            await roleTestService.createRole();
        });

        it('should be rejected if role not found', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'supervisor@example.com',
                    password: 'supervisor',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .delete(`/roles/${role.id - role.id}`)
                .set('Authorization', `Bearer ${token}`)
            
            logger.info(response.body);

            expect(response.status).toBe(404);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if lcu delete Role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'lcu@example.com',
                    password: 'lcu',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .delete(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
            
            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be rejected if user delete role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'test@example.com',
                    password: 'test',
                });

            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .delete(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)

            logger.info(response.body);

            expect(response.status).toBe(403);
            expect(response.body.errors).toBeDefined();
        });

        it('should be able to super admin delete role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });

            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .delete(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data).toBe(true);
        });

        it('should be able to supervisor delete role', async () => {
            const role = await roleTestService.getRole();
            responseLogin = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'supervisor@example.com',
                    password: 'supervisor',
                });
            token = responseLogin.body.data.token;
            const response = await request(app.getHttpServer())
                .delete(`/roles/${role.id}`)
                .set('Authorization', `Bearer ${token}`)
            
            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data).toBe(true);
        });
    });
});
