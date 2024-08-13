import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserTestService } from '../user/user.test.service';
import { UserTestModule } from '../user/user.test.module';
import { ParticipantTestService } from './participant.test.service';
import { ParticipantTestModule } from './participant.test.module';
import * as path from 'path';

describe('AuthController', () => {
    let app: INestApplication;
    let logger: Logger;
    let userTestService: UserTestService;
    let participantTestService: ParticipantTestService;

    // Paths to the dummy image files
    const sim_a = path.resolve(__dirname, 'image', 'SIM A.png');
    const sim_b = path.resolve(__dirname, 'image', 'SIM B.jpg');
    const ktp = path.resolve(__dirname, 'image', 'KTP.png');
    const foto = path.resolve(__dirname, 'image', 'foto.png');
    const surat_sehat = path.resolve(__dirname, 'image', 'surat_ket_sehat.png');
    const surat_bebas_narkoba = path.resolve(__dirname, 'image', 'surat_bebas_narkoba.png');

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

    describe('POST /participant', () => {
        let token: string;

        beforeEach(async () => {
            await participantTestService.delete();
            await userTestService.createSuperAdmin();
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    identifier: 'superadmin@example.com',
                    password: 'super admin',
                });
            token = response.body.data.token;
        });

        afterEach(async () => {
            await participantTestService.delete();
        });

        it('should allow super admin to create participant', async () => {
            const response = await request(app.getHttpServer())
                .post('/participants')
                .set('Authorization', `Bearer ${token}`)
                .field('no_pegawai', '123456')
                .field('nama', 'John Doe')
                .field('nik', '987654321')
                .field('dinas', 'IT Department')
                .field('bidang', 'Development')
                .field('perusahaan', 'Tech Corp')
                .field('email', 'john.doe@example.com')
                .field('no_telp', '08123456789')
                .field('negara', 'Indonesia')
                .field('tempat_lahir', 'Jakarta')
                .field('tanggal_lahir', '1990-01-01')
                .attach('sim_a', sim_a)
                .attach('sim_b', sim_b)
                .attach('ktp', ktp)
                .attach('foto', foto)
                .attach('surat_sehat_buta_warna', surat_sehat)
                .field('exp_surat_sehat', '2025-01-01')
                .attach('surat_bebas_narkoba', surat_bebas_narkoba)
                .field('exp_bebas_narkoba', '2025-01-01')
                .field('gmf_non_gmf', 'Tech Corp')
                .field('link_qr_code', 'www.google.com');

            logger.info(response.body);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('id');
        });

        
    });
});
