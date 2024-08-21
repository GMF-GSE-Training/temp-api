import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { ParticipantModule } from './participant/participant.module';
import { StaticModule } from './static/static.module';

@Module({
  imports: [
    CommonModule, 
    UserModule,
    AuthModule,
    RoleModule,
    ParticipantModule,
    StaticModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
