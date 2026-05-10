import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerRequest } from './request.entity';
import { RequestsService } from './requests.service';
import { RequestsResolver } from './requests.resolver';
import { OrganizationProfileModule } from 'src/organizations/organization-profile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VolunteerRequest]),
    OrganizationProfileModule, 
  ],
  providers: [RequestsService, RequestsResolver],
  exports: [RequestsService],
})
export class RequestsModule {}