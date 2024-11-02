import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { ParticipantModule } from './participant/participant.module';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from './mailer/mailer.module';
import { CapabilityModule } from './capability/capability.module';
import { CurriculumSyllabusModule } from './curriculum-syllabus/curriculum-syllabus.module';
import { CotModule } from './cot/cot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule, 
    UserModule,
    AuthModule,
    RoleModule,
    ParticipantModule,
    MailerModule,
    CapabilityModule,
    CurriculumSyllabusModule,
    CotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
