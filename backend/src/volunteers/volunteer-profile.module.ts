import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerProfile } from './volunteer-profile.entity';
import { VolunteerProfileService } from './volunteer-profile.service';
import { VolunteerProfileResolver } from './volunteer-profile.resolver';
import { RequestsModule } from 'src/requests/requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VolunteerProfile]),
    RequestsModule
  ],
  providers: [VolunteerProfileService, VolunteerProfileResolver],
  exports: [VolunteerProfileService],
})
export class VolunteerProfileModule {}
