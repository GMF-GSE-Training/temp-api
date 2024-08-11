import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';

@Module({
  imports: [
    CommonModule, 
    UserModule,
    AuthModule,
    RoleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
