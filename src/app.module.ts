import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { ParticipantModule } from './participant/participant.module';
import { ConfigModule } from '@nestjs/config';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
