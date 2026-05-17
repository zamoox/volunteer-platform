import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerRequest } from './request.entity';
import { RequestsService } from './services/requests.service';
import { RequestsResolver } from './requests.resolver';
import { OrganizationProfileModule } from 'src/organizations/organization-profile.module';
import { CaslModule } from 'src/casl/casl.module';
import { VolunteerProfile } from 'src/volunteers/volunteer-profile.entity';
import { Review } from 'src/reviews/review.entity';
import { VocabularyTaggerService } from './services/vocabulary-tagger.service';
import { PriorityService } from './services/priority.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VolunteerRequest, VolunteerProfile, Review]),
    CaslModule,
    OrganizationProfileModule
  ],
  providers: [
    RequestsService,
    RequestsResolver,
    VocabularyTaggerService, 
    PriorityService,
  ],
  exports: [RequestsService],
})
export class RequestsModule {}