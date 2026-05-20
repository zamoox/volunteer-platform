// src/organizations/organization-profile.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrganizationProfile } from './organization-profile.entity';
import { CreateOrganizationInput } from './dto/create-organization-profile.input';
import { UpdateOrganizationInput } from './dto/update-organization.input';
import { OrganizationStatus } from './enums/organization-status.enum';
import { FileUpload } from 'graphql-upload-ts';
import { join } from 'path';
import { createWriteStream, existsSync, mkdirSync } from 'fs';

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

  async update(userId: string, input: UpdateOrganizationInput): Promise<OrganizationProfile> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Профіль не знайдено');

    // Визначаємо поля, зміна яких автоматично скидає статус
    const criticalFields: (keyof UpdateOrganizationInput)[] = [
      'name', 
      'edrpou', 
      'website', 
      'phone'
    ];

    // Перевіряємо, чи змінилося хоча б одне критичне поле
    const isCriticalDataChanged = criticalFields.some(
      field => input[field] !== undefined && input[field] !== profile[field]
    );

    // Створюємо оновлений об'єкт
    const updatedProfileData = { ...input };

    if (isCriticalDataChanged) {
      updatedProfileData.status = OrganizationStatus.PENDING;
    }

    Object.assign(profile, updatedProfileData);
    return this.profileRepo.save(profile);
  }

  async findByUserId(userId: string): Promise<OrganizationProfile | null> {
    return this.profileRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async hasProfile(userId: string): Promise<boolean> {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      select: ['id'], // Тільки id — швидший запит
    });
    return !!profile;
  }

  async handleFileUploads(userId: string, reg: FileUpload, stat: FileUpload): Promise<boolean> {
    const regPath = await this.saveFile(reg, 'reg');
    const statPath = await this.saveFile(stat, 'stat');

    await this.profileRepo.update({ userId }, { 
      documents: [regPath, statPath], 
      status: OrganizationStatus.PENDING 
    });
    
    return true;
  }

  private async saveFile(file: FileUpload, prefix: string): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads');
    
    // Перевіряємо, чи існує папка, якщо ні — створюємо її
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const { filename, createReadStream } = file;
    const path = join(uploadDir, `${prefix}_${Date.now()}_${filename}`);
    
    return new Promise((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(path))
        .on('finish', () => resolve(path))
        .on('error', reject);
    });
  }
}