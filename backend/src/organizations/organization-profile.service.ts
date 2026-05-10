// src/organizations/organization-profile.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrganizationProfile } from './organization-profile.entity';
import { CreateOrganizationInput } from './dto/create-organization-profile.input';

@Injectable()
export class OrganizationProfileService {
  constructor(
    @InjectRepository(OrganizationProfile)
    private readonly profileRepo: Repository<OrganizationProfile>,
    private readonly dataSource: DataSource,
  ) {}

async create(userId: string, input: CreateOrganizationInput): Promise<OrganizationProfile> {
  return this.dataSource.transaction(async (manager) => {
    const existing = await manager.findOne(OrganizationProfile, {
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Профіль організації вже існує');
    }

    // edrpou перевірка тільки якщо передано
    if (input.edrpou) {
      const edrpouExists = await manager.findOne(OrganizationProfile, {
        where: { edrpou: input.edrpou },
      });
      if (edrpouExists) {
        throw new ConflictException('Організація з таким ЄДРПОУ вже зареєстрована');
      }
    }

    const profile = manager.create(OrganizationProfile, { ...input, userId });
    return manager.save(OrganizationProfile, profile);
  });
}

  async findByUserId(userId: string): Promise<OrganizationProfile | null> {
    return this.profileRepo.findOne({ where: { userId } });
  }

  async hasProfile(userId: string): Promise<boolean> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      select: ['id'], // Тільки id — швидший запит
    });
    return !!profile;
  }
}