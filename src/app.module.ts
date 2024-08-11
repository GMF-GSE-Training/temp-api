import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { DinasModule } from './dinas/dinas.module';

@Module({
  imports: [
    CommonModule, 
    UserModule,
    AuthModule,
    RoleModule,
    DinasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
