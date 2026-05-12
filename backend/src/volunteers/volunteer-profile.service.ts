import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VolunteerProfile } from './volunteer-profile.entity';

@Injectable()
export class VolunteerProfileService {
  constructor(
    @InjectRepository(VolunteerProfile)
    private readonly volunteerProfileRepository: Repository<VolunteerProfile>,
  ) {}

  async findMineWithReviews(userId: string): Promise<VolunteerProfile | null> {
    const profile = await this.volunteerProfileRepository.findOne({
      where: { userId },
      relations: ['reviews', 'reviews.organization', 'user'],
    });
    if (profile?.reviews?.length) {
      profile.reviews.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return profile;
  }
}
