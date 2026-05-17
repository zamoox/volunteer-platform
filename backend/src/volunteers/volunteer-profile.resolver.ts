import { Resolver, Query, ResolveField, Parent, Mutation, Args, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtUser } from 'src/common/interfaces/jwt-user.interface';
import { VolunteerProfile } from './volunteer-profile.entity';
import { VolunteerProfileService } from './volunteer-profile.service';
import { RequestsService } from 'src/requests/services/requests.service';
import { VolunteerRequest } from 'src/requests/request.entity';

@Resolver(() => VolunteerProfile)
export class VolunteerProfileResolver {
  constructor(
    private readonly volunteerProfileService: VolunteerProfileService,
    private readonly requestsService: RequestsService,
  ) {}

  @Query(() => VolunteerProfile, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async myVolunteerProfile(
    @CurrentUser() user: JwtUser,
  ): Promise<VolunteerProfile | null> {
    return this.volunteerProfileService.findMineWithReviews(user.id);
  }

  @ResolveField(() => [VolunteerRequest])
  async activeTasks(@Parent() profile: VolunteerProfile): Promise<VolunteerRequest[]> {
    return this.requestsService.findInProgressForVolunteer(profile.userId);
  }

    // ─── НОВЕ: оновити локацію волонтера ────────────────────────────────────
  @Mutation(() => VolunteerProfile)
  @UseGuards(JwtAuthGuard)
  async updateVolunteerLocation(
    @CurrentUser() user: JwtUser,
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ): Promise<VolunteerProfile> {
    return this.volunteerProfileService.updateLocation(user.id, lat, lng);
  }

  // ─── НОВЕ: волонтери поруч (для карти) ──────────────────────────────────
  @Query(() => [VolunteerProfile])
  async getNearbyVolunteers(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
    @Args('radius', { type: () => Float, defaultValue: 10000 }) radius: number,
  ): Promise<VolunteerProfile[]> {
    return this.volunteerProfileService.getNearbyVolunteers(lat, lng, radius);
  }
}


