import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { VolunteerRequest } from '../requests/request.entity';
import { AdminUsersResolver } from './resolvers/admin-users.resolver';
import { UsersModule } from '../users/users.module';
import { RequestsModule } from '../requests/requests.module';
import { CaslModule } from '../casl/casl.module';
import { OrganizationProfileModule } from 'src/organizations/organization-profile.module';
import { AdminUsersService } from './services/admin-users.service';
import { AdminLog } from './entities/admin-log.entity';
import { OrganizationProfile } from 'src/organizations/organization-profile.entity';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminDashboardResolver } from './resolvers/admin-dashboard.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminLog, User, VolunteerRequest, OrganizationProfile]),
    UsersModule,
    RequestsModule,
    OrganizationProfileModule,
    CaslModule
  ],
  providers: [
    AdminUsersService, AdminUsersResolver,
    AdminDashboardService, AdminDashboardResolver,
    // ... інші сервіси та резолвери
  ]
})
export class AdminModule {}