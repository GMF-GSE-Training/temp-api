import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { DinasModule } from './dinas/dinas.module';
import { ParticipantModule } from './participant/participant.module';

@Module({
  imports: [
    CommonModule, 
    UserModule,
    AuthModule,
    RoleModule,
    DinasModule,
    ParticipantModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
