import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerRequest } from './request.entity';
import { RequestsService } from './requests.service';
import { RequestsResolver } from './requests.resolver';
import { OrganizationProfileModule } from 'src/organizations/organization-profile.module';
import { CaslModule } from 'src/casl/casl.module';
import { VolunteerProfile } from 'src/volunteers/volunteer-profile.entity';
import { Review } from 'src/reviews/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VolunteerRequest, VolunteerProfile, Review]),
    OrganizationProfileModule,
    CaslModule 
  ],
  providers: [RequestsService, RequestsResolver],
  exports: [RequestsService],
})
export class RequestsModule {}