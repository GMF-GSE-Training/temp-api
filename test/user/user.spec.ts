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

describe('UserController', () => {
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

  afterEach(async () => {
    await userTestService.deleteMany();
  });

  describe('POST /users/register', () => {
    beforeEach(async () => {
      await userTestService.deleteUser();
      await participantTestService.delete();
    });

    afterEach(async () => {
      await userTestService.deleteMany();
    });

    describe('Invalid request', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });
  
      afterEach(async () => {
        await participantTestService.delete();
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
            dinas: '',
            roleId: '',
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    })

    describe('success', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });
  
      afterEach(async () => {
        await participantTestService.delete();
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
            dinas: "TA",
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(200);
        expect(response.body.data.no_pegawai).toBe('test');
        expect(response.body.data.nik).toBe('test');
        expect(response.body.data.email).toBe('test@example.com');
        expect(response.body.data.name).toBe('test');
        expect(response.body.data.dinas).toBe("TA");
        expect(response.body.data.roleId).toBe(4);
      });
    });

    describe('email already exists', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });
  
      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be rejected if no_pegawai already exists', async () => {
        await userTestService.createUser();
        const response = await request(app.getHttpServer())
          .post('/users/register')
          .send({
            no_pegawai: 'test',
            nik: 'abcd',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    });
  });

  describe('POST /users/create, super admin creates all users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await userTestService.createSuperAdmin();
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
          dinas: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to super admin create super admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.roleId).toBe(1);
    });

    it('should be able to super admin create supervisor', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.roleId).toBe(2);
    });

    it('should be able to super admin create lcu', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinas: "TA",
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');

      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(3);
    });

    describe('Super Admin creates user', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });
  
      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be able to super admin create user', async () => {
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
            roleId: 4,
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(200);
        expect(response.body.data.no_pegawai).toBe('test');
        expect(response.body.data.nik).toBe('test');
        expect(response.body.data.email).toBe('test@example.com');
        expect(response.body.data.name).toBe('test');
        expect(response.body.data.dinas).toBe("TA");
        expect(response.body.data.roleId).toBe(4);
      });
    });

    describe('No Pegawai already exists', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });
  
      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be rejected if no_pegawai already exists', async () => {
        await userTestService.createUser();
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    });
  });

  describe('POST /users/create, supervisor creates users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await userTestService.createSupervisor();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'supervisor@example.com',
          password: 'supervisor',
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
          dinas: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if supervisor creates super admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to supervisor create supervisor', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.roleId).toBe(2);
    });

    it('should be able to supervisor create lcu', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinas: "TA",
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(3);
    });

    describe('Create user', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });

      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be able to supervisor create user', async () => {
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
            roleId: 4,
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(200);
        expect(response.body.data.no_pegawai).toBe('test');
        expect(response.body.data.nik).toBe('test');
        expect(response.body.data.email).toBe('test@example.com');
        expect(response.body.data.name).toBe('test');
        expect(response.body.data.dinas).toBe("TA");
        expect(response.body.data.roleId).toBe(4);
      });
    });

    describe('No Pegawai already exists', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });

      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be rejected if no_pegawai already exists', async () => {
        await userTestService.createUser();
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('Email already exists', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });

      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be rejected if email already exists', async () => {
        await userTestService.createUser();
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    });
  });

  describe('POST /users/create, lcu creates users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await userTestService.createLCU();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'lcu@example.com',
          password: 'lcu',
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
          dinas: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu creates super admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu creates supervisor', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu creates lcu', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    describe('rejected LCU creates user', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });

      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be rejected if the lcu creates a user with a service that is different units', async () => {
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TB",
            roleId: 2,
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(403);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('LCU creates user', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });

      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be able to lcu create user', async () => {
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
            roleId: 4,
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(200);
        expect(response.body.data.no_pegawai).toBe('test');
        expect(response.body.data.nik).toBe('test');
        expect(response.body.data.email).toBe('test@example.com');
        expect(response.body.data.name).toBe('test');
        expect(response.body.data.dinas).toBe("TA");
        expect(response.body.data.roleId).toBe(4);
      });
    });

    describe('No Pegawai already exists', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });

      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be rejected if no_pegawai already exists', async () => {
        await userTestService.createUser();
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('Email already exists', () => {
      beforeEach(async () => {
        await participantTestService.create();
      });

      afterEach(async () => {
        await participantTestService.delete();
      });

      it('should be rejected if email already exists', async () => {
        await userTestService.createUser();
        const response = await request(app.getHttpServer())
          .post('/users/create')
          .set('Authorization', `Bearer ${token}`)
          .send({
            no_pegawai: 'test',
            nik: 'test',
            email: 'test@example.com',
            name: 'test',
            password: 'test',
            dinas: "TA",
          });
  
        logger.info(response.body);
  
        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      });
    });
  });

  describe('POST /users/create, user creates users', () => {
    let token: string;

    beforeEach(async () => {
      await participantTestService.create();
      await userTestService.deleteUser();
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
      await participantTestService.delete();
      await userTestService.deleteMany();
    });

    it('should be rejected if user creates super admin', async () => {
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

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if user creates supervisor', async () => {
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

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu creates lcu', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if user creates user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test',
          nik: 'test',
          email: 'test@example.com',
          name: 'test',
          password: 'test',
          dinas: "TA",
          roleId: 4,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /users/:userId, super admin get all users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await participantTestService.delete();
      await participantTestService.create();
      await userTestService.createSuperAdmin();
      await userTestService.createUser();
      await userTestService.createSupervisor();
      await userTestService.createLCU();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'superadmin@example.com',
          password: 'super admin',
        });
      token = response.body.data.token;
    });

    it('should be rejected if user not found', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id - user.id}`)
        .set('Authorization', `Bearer ${token}`);

      logger.info(response.body);

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to super admin get super admin', async () => {
      const user = await userTestService.getSuperAdmin();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('super admin');
      expect(response.body.data.email).toBe('superadmin@example.com');
      expect(response.body.data.name).toBe('super admin');
      expect(response.body.data.roleId).toBe(1);
    });

    it('should be able to super admin get supervisor', async () => {
      const user = await userTestService.getSupervisor();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('supervisor');
      expect(response.body.data.email).toBe('supervisor@example.com');
      expect(response.body.data.name).toBe('supervisor');
      expect(response.body.data.roleId).toBe(2);
    });

    it('should be able to super admin get lcu', async () => {
      const user = await userTestService.getLCU();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('lcu');
      expect(response.body.data.email).toBe('lcu@example.com');
      expect(response.body.data.name).toBe('lcu');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(3);
    });

    it('should be able to super admin get user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.nik).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(4);
    });
  });

  describe('GET /users/:userId, supervisor get all users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await participantTestService.delete();
      await participantTestService.create();
      await userTestService.createSuperAdmin();
      await userTestService.createUser();
      await userTestService.createSupervisor();
      await userTestService.createLCU();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'supervisor@example.com',
          password: 'supervisor',
        });
      token = response.body.data.token;
    });

    it('should be rejected if user not found', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id - user.id}`)
        .set('Authorization', `Bearer ${token}`);

      logger.info(response.body);

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if supervisor get super admin', async () => {
      const user = await userTestService.getSuperAdmin();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to supervisor get supervisor', async () => {
      const user = await userTestService.getSupervisor();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('supervisor');
      expect(response.body.data.email).toBe('supervisor@example.com');
      expect(response.body.data.name).toBe('supervisor');
      expect(response.body.data.roleId).toBe(2);
    });

    it('should be able to supervisor get lcu', async () => {
      const user = await userTestService.getLCU();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('lcu');
      expect(response.body.data.email).toBe('lcu@example.com');
      expect(response.body.data.name).toBe('lcu');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(3);
    });

    it('should be able to supervisor get user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test');
      expect(response.body.data.nik).toBe('test');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('test');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(4);
    });
  });

  describe('PATCH /users/:userId, super admin updates all users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await userTestService.createSuperAdmin();
      await userTestService.createUser();
      await userTestService.createSupervisor();
      await userTestService.createLCU();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'superadmin@example.com',
          password: 'super admin',
        });
      token = response.body.data.token;
    });

    it('should be rejected if user is not found', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id - user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test update',
        });

      logger.info(response.body);

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if request is invalid', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: '',
          nik: '',
          email: '',
          name: '',
          password: '',
          dinas: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to super admin updates super admin', async () => {
      const user = await userTestService.getSuperAdmin();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.roleId).toBe(1);
    });

    it('should be able to super admin updates supervisor', async () => {
      const user = await userTestService.getSupervisor();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.roleId).toBe(2);
    });

    it('should be able to super admin updates lcu', async () => {
      const user = await userTestService.getLCU();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          dinas: "TA",
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(3);
    });

    it('should be able to super admin updates user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          dinas: "TA",
          roleId: 4,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(4);
    });
  });

  describe('PATCh /users/update, supervisor updates users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await userTestService.createSuperAdmin();
      await userTestService.createSupervisor();
      await userTestService.createLCU();
      await userTestService.createUser();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'supervisor@example.com',
          password: 'supervisor',
        });
      token = response.body.data.token;
    });

    it('should be rejected if user is not found', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id - user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test update',
        });

      logger.info(response.body);

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if request is invalid', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: '',
          nik: '',
          email: '',
          name: '',
          password: '',
          dinas: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if supervisor updates super admin', async () => {
      const user = await userTestService.getSuperAdmin();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to supervisor updates supervisor', async () => {
      const user = await userTestService.getSupervisor();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.roleId).toBe(2);
    });

    it('should be able to supervisor updates lcu', async () => {
      const user = await userTestService.getLCU();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          dinas: "TA",
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(3);
    });

    it('should be able to supervisor updates user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          dinas: "TA",
          roleId: 4,
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(4);
    });
  });

  describe('PATCH /users/update, lcu updates users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await userTestService.createSuperAdmin();
      await userTestService.createSupervisor();
      await userTestService.createLCU();
      await userTestService.createUser();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'lcu@example.com',
          password: 'lcu',
        });
      token = response.body.data.token;
    });

    it('should be rejected if user is not found', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id - user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test update',
        });

      logger.info(response.body);

      expect(response.status).toBe(404);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if request is invalid', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: '',
          nik: '',
          email: '',
          name: '',
          password: '',
          dinas: '',
          roleId: '',
        });

      logger.info(response.body);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu updates super admin', async () => {
      const user = await userTestService.getSuperAdmin();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test',
          password: 'test',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu updates supervisor', async () => {
      const user = await userTestService.getSupervisor();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu updates lcu', async () => {
      const user = await userTestService.getLCU();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if the lcu updates a user with a service that is different units', async () => {
      await userTestService.createUserDinasTC();
      const user = await userTestService.getUserDinasTC();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          dinas: "TC",
          roleId: 4,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be able to lcu updates user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
        });

      logger.info(response.body);

      expect(response.status).toBe(200);
      expect(response.body.data.no_pegawai).toBe('test updated');
      expect(response.body.data.nik).toBe('test updated');
      expect(response.body.data.email).toBe('testupdated@example.com');
      expect(response.body.data.name).toBe('test updated');
      expect(response.body.data.dinas).toBe("TA");
      expect(response.body.data.roleId).toBe(4);
    });

    it('should be rejected if lcu updates dinas user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          dinas: "TC",
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu updates role user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PATCH /users/update, user updates users', () => {
    let token: string;

    beforeEach(async () => {
      await userTestService.deleteUser();
      await userTestService.createSuperAdmin();
      await userTestService.createSupervisor();
      await userTestService.createLCU();
      await userTestService.createUser();
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'test',
        });
      token = response.body.data.token;
    });

    it('should be rejected if user updates super admin', async () => {
      const user = await userTestService.getSuperAdmin();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 1,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if user updates supervisor', async () => {
      const user = await userTestService.getSupervisor();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 2,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if lcu updates lcu', async () => {
      const user = await userTestService.getLCU();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          roleId: 3,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });

    it('should be rejected if user updates user', async () => {
      const user = await userTestService.getUser();
      const response = await request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          no_pegawai: 'test updated',
          nik: 'test updated',
          email: 'testupdated@example.com',
          name: 'test updated',
          password: 'test updated',
          dinas: "TA",
          roleId: 4,
        });

      logger.info(response.body);

      expect(response.status).toBe(403);
      expect(response.body.errors).toBeDefined();
    });
  });
});
