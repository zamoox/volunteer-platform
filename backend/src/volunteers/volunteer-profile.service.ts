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

  async updateLocation(
    userId: string,
    lat: number,
    lng: number,
  ): Promise<VolunteerProfile> {
    // ensureProfile — автоматично створює профіль якщо його немає
    let profile = await this.volunteerProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.volunteerProfileRepository.create({
        userId,
        averageRating: 0,
        completedRequestsCount: 0,
      });
    }

    profile.location = {
      type: 'Point',
      coordinates: [lng, lat], // PostGIS: [longitude, latitude]
    } as any;
    profile.lastActiveAt = new Date();

    return this.volunteerProfileRepository.save(profile);
  }

  
  async getNearbyVolunteers(
    lat: number,
    lng: number,
    radiusMeters: number = 10000, // 10 км за замовчуванням
  ): Promise<VolunteerProfile[]> {
    return this.volunteerProfileRepository
      .createQueryBuilder('vp')
      .where('vp.location IS NOT NULL')
      .andWhere(
        `ST_DWithin(
           vp.location::geography,
           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
           :radius
         )`,
        { lat, lng, radius: radiusMeters },
      )
      // Сортуємо від найближчого до найдальшого
      .addSelect(
        `ST_Distance(
           vp.location::geography,
           ST_SetSRID(ST_MakePoint(:lng2, :lat2), 4326)::geography
         )`,
        'distance_m',
      )
      .setParameters({ lat2: lat, lng2: lng })
      .leftJoinAndSelect('vp.user', 'user')
      .orderBy('distance_m', 'ASC')
      // Показуємо лише активних за останні 30 хвилин
      .andWhere(
        `vp.lastActiveAt > NOW() - INTERVAL '30 minutes'`,
      )
      .getMany();
  }
}
